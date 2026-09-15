import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    return sendRedirect(event, '/shopping', 302)
  }

  // Busca a URL de afiliado correspondente ao slug ativo
  const { data, error } = await client
    .from('shopping_products')
    .select('affiliate_url')
    .eq('redirect_slug', slug)
    .eq('is_active', true)
    .single()

  if (data?.affiliate_url && !error) {
    // Incrementa o contador chamando a função RPC que criamos no Supabase
    // Como a RPC foi criada com SECURITY DEFINER, ela consegue executar o UPDATE ignorando RLS restritivo
    await client.rpc('increment_click_count', { p_slug: slug })

    // Redireciona para o link do parceiro (Link cloaking)
    return sendRedirect(event, data.affiliate_url, 302)
  }

  // Fallback caso o link não exista, esteja desativado ou dê erro
  return sendRedirect(event, '/shopping', 302)
})
