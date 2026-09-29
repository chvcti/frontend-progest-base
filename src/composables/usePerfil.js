/**
 * Composable: usePerfil
 *
 * Centraliza a detecção do perfil do usuário logado no setor atual.
 * O perfil ('admin', 'almoxarife', 'solicitante') é lido da lista
 * `listUsuariosSetor` no Vuex — a mesma fonte usada no Sidebar e Home.
 *
 * Uso:
 *   import { usePerfil } from '@/composables/usePerfil'
 *   const { isAdmin, isAlmoxarife, isSolicitante } = usePerfil()
 */
import { computed } from 'vue'
import { useStore } from 'vuex'

export function usePerfil() {
  const store = useStore()

  /**
   * Retorna true se o usuário logado possui o perfil especificado
   * no setor atual (conforme a lista listUsuariosSetor do Vuex).
   */
  const temPerfil = (perfilAlvo) => {
    const user = store.state.auth?.user ?? store.state.user
    if (!user) return false

    // GOD MODE: Super Admin tem todos os poderes, menos o de Solicitante
    if (store?.getters?.['auth/isSuperAdmin'] ?? store?.getters?.isSuperAdmin) {
      if (perfilAlvo === 'solicitante') return false;
      return true;
    }

    const list = store.state.estoque?.listUsuariosSetor ?? store.state.listUsuariosSetor ?? []

    // Verificar na lista de usuários do setor atual
    const found = list.some((u) => {
      const userId = u.usuario_id || u.user_id || u.id || (u.usuario && u.usuario.id)
      const perfil = (u.perfil || (u.pivot && u.pivot.perfil) || '')
        .toString()
        .toLowerCase()
      return userId === user.id && perfil === perfilAlvo
    })

    if (found) return true

    // Verificar nos setores vinculados ao próprio usuário (user.setores)
    const setorId = store.state.estoque?.setorAtualId || store.state.estoque?.setorDetails?.id
    if (setorId && Array.isArray(user.setores)) {
      const vinculo = user.setores.find((s) => Number(s.id || s.setor_id) === Number(setorId))
      if (vinculo) {
        const perfil = (vinculo.pivot?.perfil || vinculo.perfil || '').toString().toLowerCase()
        if (perfil === perfilAlvo) return true
      }
    }

    // Fallback: checar roles/perfil direto no objeto user (compatibilidade legada)
    if (
      (user.roles && user.roles.includes && user.roles.includes(perfilAlvo)) ||
      (user.perfil && user.perfil.toString().toLowerCase() === perfilAlvo)
    ) {
      return true
    }

    return false
  }

  /** Usuário é admin no setor atual */
  const isAdmin = computed(() => temPerfil('admin'))

  /** Usuário é almoxarife no setor atual */
  const isAlmoxarife = computed(() => temPerfil('almoxarife'))

  /** Usuário é solicitante no setor atual */
  const isSolicitante = computed(() => temPerfil('solicitante'))

  /**
   * Retorna true se o usuário tem acesso a relatórios
   * (somente admin e almoxarife)
   */
  const podeVerRelatorios = computed(() => isAdmin.value || isAlmoxarife.value)

  return {
    isAdmin,
    isAlmoxarife,
    isSolicitante,
    podeVerRelatorios,
  }
}
