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

    // Build the prompt for AI
    const systemPrompt = `Você é um assistente especializado em criar newsletters profissionais. 
Sua tarefa é analisar os links fornecidos e criar uma newsletter completa em dois formatos: HTML e texto puro.

Configurações do projeto:
- Tom de voz: ${project.tone || 'profissional e informativo'}
- Estrutura: ${project.structure || 'padrão'}
- Idioma: ${project.language || 'pt-BR'}
- Nome do autor: ${project.author_name}
- Bio do autor: ${project.author_bio || ''}

IMPORTANTE:
1. Crie uma newsletter bem formatada e organizada
2. Inclua um resumo ou comentário sobre cada link fornecido
3. Mantenha o tom de voz especificado
4. Siga a estrutura definida pelo projeto
5. Para o HTML, use formatação apropriada para emails (inline styles, tabelas para layout)
6. Para o texto, mantenha uma formatação limpa e legível`;

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