export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser()
  
  // Se não estiver autenticado, joga pro login com parâmetro de redirecionamento
  if (!user.value) {
    return navigateTo(`/login?redirectTo=${to.path}`)
  }
})
