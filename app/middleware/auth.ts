export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  
  // Se não estiver autenticado, joga pro login com parâmetro de redirecionamento
  if (!user.value) {
    return navigateTo(`/login?redirectTo=${to.path}`)
  }

  // Proteção rígida para rotas administrativas
  if (to.path.startsWith('/admin')) {
    const supabase = useSupabaseClient()
    
    // Consulta a tabela de perfis para saber se o usuário é administrador
    // Usamos 'as any' para evitar o erro do TypeScript (type 'never') já que não geramos os tipos do Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.value.id)
      .single() as any

    console.log('MIDDLEWARE ADMIN CHECK:', { 
      userId: user.value.id, 
      userEmail: user.value.email,
      profileData: data, 
      profileError: error 
    })

    // Hardcode infallível para a conta dona do sistema caso a tabela demore a carregar
    if (user.value.email === 'camilatavares.arq@gmail.com') {
      return
    }

    // Se não for administrador (ou se der erro/não existir), expulsa para a página principal
    if (!data || data.is_admin !== true) {
      console.log('REDIRECIONANDO PARA HOME - NÃO É ADMIN')
      return navigateTo('/')
    }
  }
})
