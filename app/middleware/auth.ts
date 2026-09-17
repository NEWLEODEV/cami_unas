export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  
  // Se não estiver autenticado, joga pro login com parâmetro de redirecionamento
  if (!user.value) {
    return navigateTo(`/login?redirectTo=${to.path}`)
  }

  // Proteção rígida para rotas administrativas
  if (to.path.startsWith('/admin')) {
    // Hardcode infalível para a conta dona do sistema.
    // Fazemos isso ANTES da query para evitar erro no banco caso o id esteja undefined (comum em mocks de dev).
    if (user.value.email === 'camilatavares.arq@gmail.com') {
      return
    }

    // Se o usuário não tiver ID válido e não for o admin principal, expulsa
    if (!user.value.id) {
      return navigateTo('/')
    }

    const supabase = useSupabaseClient()

    // Consulta a tabela de perfis para saber se o usuário é administrador
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

    // Se não for administrador (ou se der erro/não existir), expulsa para a página principal
    if (!data || data.is_admin !== true) {
      console.log('REDIRECIONANDO PARA HOME - NÃO É ADMIN')
      return navigateTo('/')
    }
  }
})
