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
    const { newsletter_id, html_content, text_content, error } = await req.json();
    
    if (!newsletter_id) {
      return new Response(
        JSON.stringify({ error: 'newsletter_id é obrigatório' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Callback received for newsletter:', newsletter_id);
    console.log('Has error:', !!error);
    console.log('Has content:', !!html_content && !!text_content);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch newsletter to validate it exists and is in generating status
    const { data: newsletter, error: fetchError } = await supabase
      .from('newsletters')
      .select('id, status')
      .eq('id', newsletter_id)
      .single();

    if (fetchError) {
      console.error('Error fetching newsletter:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Newsletter não encontrada' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Check if newsletter is still in generating status
    if (newsletter.status !== 'generating') {
      console.log('Newsletter is not in generating status, current status:', newsletter.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Newsletter não está mais em estado de geração' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Update newsletter based on whether there was an error
    if (error) {
      console.log('Updating newsletter with error:', error);
      
      const { error: updateError } = await supabase
        .from('newsletters')
        .update({
          status: 'error',
          error_message: `Erro no webhook: ${error}`
        })
        .eq('id', newsletter_id);

      if (updateError) {
        console.error('Error updating newsletter:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Erro registrado com sucesso' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Validate content is present
    if (!html_content || !text_content) {
      return new Response(
        JSON.stringify({ error: 'html_content e text_content são obrigatórios' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Updating newsletter with generated content');

    // Update newsletter with success content
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        html_content,
        text_content,
        status: 'final',
        error_message: null
      })
      .eq('id', newsletter_id);

    if (updateError) {
      console.error('Error updating newsletter:', updateError);
      throw updateError;
    }

    console.log('Newsletter updated successfully!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Newsletter atualizada com sucesso' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in newsletter-callback:', error);
    
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
