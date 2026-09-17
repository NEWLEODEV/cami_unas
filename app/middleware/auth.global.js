export default defineNuxtRouteMiddleware((to, _from) => {
  const user = useSupabaseUser()

  // Se o usuário não estiver logado e tentar acessar qualquer página que não seja o login,
  // redireciona para a página de login.
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  // Se o usuário já estiver logado e tentar acessar a página de login,
  // redireciona para a página principal (dashboard).
  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
