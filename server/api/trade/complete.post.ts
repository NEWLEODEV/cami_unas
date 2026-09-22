import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { requestId, quantity, price } = body

  if (!requestId || quantity === undefined || price === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campos obrigatórios faltando: requestId, quantity ou price.'
    })
  }

  // Obter cliente supabase autenticado do usuário logado
  const supabase = await serverSupabaseClient(event)
  
  // Obter o usuário logado para passar para o RPC
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Usuário não autenticado.'
    })
  }

  // Chamar a função RPC que criamos no Supabase
  const { data, error } = await supabase.rpc('process_trade_completion', {
    p_request_id: requestId,
    p_user_id: user.id,
    p_quantity: quantity,
    p_price: price
  })

  if (error) {
    console.error('Erro ao processar conclusão de trade:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno ao processar a negociação: ' + error.message
    })
  }

  // Verificar se o retorno do RPC indicou sucesso
  // data será um objeto json vindo da função
  if (data && !data.success) {
    throw createError({
      statusCode: 400,
      statusMessage: data.message || 'Falha na validação da transação.'
    })
  }

  return {
    success: true,
    data: data
  }
})
