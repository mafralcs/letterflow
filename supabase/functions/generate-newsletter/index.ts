import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsletterId } = await req.json();
    
    if (!newsletterId) {
      throw new Error('newsletterId é obrigatório');
    }

    console.log('Processing newsletter:', newsletterId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch newsletter data
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*, projects(*)')
      .eq('id', newsletterId)
      .single();

    if (newsletterError) throw newsletterError;
    if (!newsletter) throw new Error('Newsletter não encontrada');

    console.log('Newsletter data loaded:', newsletter.title);

    // Extract project configuration
    const project = newsletter.projects;
    const links = newsletter.links_raw?.split('\n').filter((l: string) => l.trim()) || [];
    const notes = newsletter.notes || '';

    // Fetch project spreadsheets data
    console.log('Fetching project spreadsheets...');
    const { data: spreadsheets, error: spreadsheetsError } = await supabase
      .from('project_spreadsheets')
      .select('id, name, description')
      .eq('project_id', project.id);

    if (spreadsheetsError) {
      console.error('Error fetching spreadsheets:', spreadsheetsError);
    }

    const projectData = [];
    if (spreadsheets && spreadsheets.length > 0) {
      for (const spreadsheet of spreadsheets) {
        // Fetch columns
        const { data: columns } = await supabase
          .from('spreadsheet_columns')
          .select('name, column_type')
          .eq('spreadsheet_id', spreadsheet.id)
          .order('column_order');

        // Fetch rows
        const { data: rows } = await supabase
          .from('spreadsheet_rows')
          .select('data')
          .eq('spreadsheet_id', spreadsheet.id)
          .order('row_order');

        if (columns && rows) {
          projectData.push({
            spreadsheet_name: spreadsheet.name,
            description: spreadsheet.description,
            columns: columns.map(c => c.name),
            rows: rows.map(r => r.data)
          });
        }
      }
      console.log(`Loaded ${projectData.length} spreadsheets with data`);
    }

    // Check if project uses webhook
    if (project.ai_provider === 'webhook' && project.webhook_url) {
      console.log('Using external webhook:', project.webhook_url);

      try {
        // Prepare payload for webhook
        const webhookPayload = {
          newsletter_id: newsletterId,
          newsletter_title: newsletter.title,
          links,
          notes,
          project: {
            name: project.name,
            author_name: project.author_name,
            author_bio: project.author_bio,
            tone: project.tone,
            structure: project.structure,
            language: project.language,
            newsletter_type: project.newsletter_type,
            logo_url: project.logo_url,
            design_guidelines: project.design_guidelines,
            html_template: project.html_template,
          },
          project_data: projectData
        };

        // Call external webhook with timeout
        const webhookResponse = await fetch(project.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(60000), // 60 second timeout
        });

        if (!webhookResponse.ok) {
          throw new Error(`Webhook retornou erro: ${webhookResponse.status}`);
        }

        const webhookData = await webhookResponse.json();

        // Validate response format
        if (!webhookData.html_content || !webhookData.text_content) {
          throw new Error('Webhook não retornou html_content e text_content');
        }

        console.log('Webhook response received successfully');

        // Check if newsletter generation was cancelled
        const { data: currentNewsletter } = await supabase
          .from('newsletters')
          .select('status')
          .eq('id', newsletterId)
          .single();

        if (currentNewsletter?.status !== 'generating') {
          console.log('Newsletter generation was cancelled, discarding webhook result');
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Geração foi cancelada pelo usuário' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }

        // Update newsletter with webhook content
        const { error: updateError } = await supabase
          .from('newsletters')
          .update({
            html_content: webhookData.html_content,
            text_content: webhookData.text_content,
            status: 'final',
            error_message: null
          })
          .eq('id', newsletterId);

        if (updateError) throw updateError;

        console.log('Newsletter generated successfully via webhook!');

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Newsletter gerada com sucesso via webhook!' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );

      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        
        // Update newsletter status to error
        await supabase
          .from('newsletters')
          .update({
            status: 'error',
            error_message: `Erro no webhook: ${webhookError instanceof Error ? webhookError.message : 'Erro desconhecido'}`
          })
          .eq('id', newsletterId);

        return new Response(
          JSON.stringify({ 
            error: `Erro no webhook: ${webhookError instanceof Error ? webhookError.message : 'Erro desconhecido'}` 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }
    }

    // Use internal Lovable AI if no webhook configured
    console.log('Using internal Lovable AI');

    // Determine newsletter style based on type
    const isInstitutional = project.newsletter_type === 'institutional';
    const newsletterStyle = isInstitutional
      ? 'Newsletter INSTITUCIONAL: Use linguagem corporativa e profissional. Tom formal e neutro. Foco na organização, não em um autor individual.'
      : 'Newsletter PESSOAL: Foco no autor e sua perspectiva. Tom conversacional e próximo. Assinatura pessoal no final. Estilo de curadoria individual.';

    // Build the prompt for AI
    const systemPrompt = `Você é um assistente especializado em criar newsletters profissionais.
Sua tarefa é analisar os links fornecidos e criar uma newsletter completa em dois formatos: HTML e texto puro.

TIPO DE NEWSLETTER: ${newsletterStyle}

Configurações do projeto:
- Tom de voz: ${project.tone || 'profissional e informativo'}
- Estrutura: ${project.structure || 'padrão'}
- Idioma: ${project.language || 'pt-BR'}
- Nome do autor: ${project.author_name}
- Bio do autor: ${project.author_bio || ''}

${projectData.length > 0 ? `DADOS DO PROJETO:
O projeto possui os seguintes dados estruturados que DEVEM ser considerados na geração da newsletter quando relevante:

${projectData.map(sheet => `
[Planilha: ${sheet.spreadsheet_name}]
${sheet.description ? `Descrição: ${sheet.description}` : ''}
Colunas: ${sheet.columns.join(', ')}
Dados (${sheet.rows.length} linhas):
${sheet.rows.map((row: any) => 
  sheet.columns.map(col => `${col}: ${row[col] || 'N/A'}`).join(' | ')
).slice(0, 10).join('\n')}
${sheet.rows.length > 10 ? `... e mais ${sheet.rows.length - 10} linhas` : ''}
`).join('\n')}

IMPORTANTE: Use esses dados estruturados para enriquecer o conteúdo da newsletter sempre que fizer sentido contextualmente.
` : ''}

${project.logo_url && isInstitutional ? `LOGO DA EMPRESA:
URL do logo: ${project.logo_url}
IMPORTANTE: Para newsletters institucionais, inclua o logo no cabeçalho do HTML usando esta URL. Use uma tag <img> com estilos inline apropriados para emails.` : ''}

${project.design_guidelines ? `DIRETRIZES DE DESIGN VISUAL (SIGA RIGOROSAMENTE):
${project.design_guidelines}

IMPORTANTE: Todas as newsletters deste projeto DEVEM seguir EXATAMENTE estas diretrizes visuais para manter consistência. 
Use as cores, fontes, espaçamentos e elementos especificados acima em TODAS as newsletters geradas.` : ''}

${project.html_template ? `TEMPLATE HTML DE REFERÊNCIA:
Use o seguinte template HTML como base visual e estrutural para a newsletter:

${project.html_template}

IMPORTANTE: Mantenha o mesmo estilo visual, estrutura de layout e elementos do template acima.` : ''}

IMPORTANTE:
1. Crie uma newsletter bem formatada e organizada
2. Inclua um resumo ou comentário sobre cada link fornecido
3. Mantenha o tom de voz especificado
4. Siga a estrutura definida pelo projeto
5. Para o HTML, use formatação apropriada para emails (inline styles, tabelas para layout)
6. Para o texto, mantenha uma formatação limpa e legível
${project.design_guidelines ? '7. SIGA FIELMENTE as diretrizes de design visual especificadas para garantir CONSISTÊNCIA entre todas as newsletters' : ''}
${isInstitutional ? '8. Para newsletters INSTITUCIONAIS: use linguagem corporativa, inclua o logo no cabeçalho, rodapé com informações da organização' : '8. Para newsletters PESSOAIS: foque no autor, use tom conversacional, inclua assinatura pessoal'}`;

    const userPrompt = `Crie uma newsletter com base nos seguintes links:

${links.map((link: string, idx: number) => `${idx + 1}. ${link}`).join('\n')}

${notes ? `\nNotas/Brief específicos desta edição:\n${notes}` : ''}

Por favor, retorne a newsletter em dois formatos:

1. HTML (formatado para email, com estilos inline)
2. Texto puro (bem formatado para leitura)

Use a ferramenta format_newsletter para estruturar sua resposta.`;

    console.log('Calling Lovable AI...');

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'format_newsletter',
              description: 'Formata a newsletter nos formatos HTML e texto',
              parameters: {
                type: 'object',
                properties: {
                  html_content: {
                    type: 'string',
                    description: 'Conteúdo HTML da newsletter com estilos inline'
                  },
                  text_content: {
                    type: 'string',
                    description: 'Conteúdo em texto puro da newsletter'
                  }
                },
                required: ['html_content', 'text_content'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'format_newsletter' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`Erro na API de IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract the tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('IA não retornou dados no formato esperado');
    }

    const newsletterContent = JSON.parse(toolCall.function.arguments);
    
    console.log('Updating newsletter with generated content...');

    // Check if newsletter generation was cancelled
    const { data: currentNewsletter } = await supabase
      .from('newsletters')
      .select('status')
      .eq('id', newsletterId)
      .single();

    if (currentNewsletter?.status !== 'generating') {
      console.log('Newsletter generation was cancelled, discarding AI result');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Geração foi cancelada pelo usuário' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Update newsletter with generated content
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        html_content: newsletterContent.html_content,
        text_content: newsletterContent.text_content,
        status: 'final',
        error_message: null
      })
      .eq('id', newsletterId);

    if (updateError) throw updateError;

    console.log('Newsletter generated successfully!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Newsletter gerada com sucesso!' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating newsletter:', error);
    
    // Try to update newsletter status to error
    try {
      const { newsletterId } = await req.json();
      if (newsletterId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('newsletters')
          .update({
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido'
          })
          .eq('id', newsletterId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});