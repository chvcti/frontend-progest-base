import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EstoqueReport from '@/views/relatorios/EstoqueReport.vue';
import functionsRelatorios from '@/functions/cad_relatorios.js';
import functionsPolos from '@/functions/cad_unidades_polos.js';
import functionsSetores from '@/functions/cad_setores.js';
import functionsGrupoProduto from '@/functions/cad_grupo_produto.js';
import { createStore } from 'vuex';

// Mocks
vi.mock('@/functions/cad_relatorios.js', () => ({
  default: { listEstoqueReport: vi.fn() }
}));
vi.mock('@/functions/cad_unidades_polos.js', () => ({
  default: { listAll: vi.fn() }
}));
vi.mock('@/functions/cad_setores.js', () => ({
  default: { listAll: vi.fn() }
}));
vi.mock('@/functions/cad_grupo_produto.js', () => ({
  default: { listAll: vi.fn() }
}));

const mockStore = createStore({
  modules: {
    auth: {
      namespaced: true,
      state: () => ({
        user: { id: 1 },
      }),
      getters: {
        isSuperAdmin: () => true,
      },
    },
    cadastros: {
      namespaced: true,
      state: () => ({
        listPolos: [],
        listSetoresGerais: [],
        listGrupoProdutos: [],
      }),
    },
    estoque: {
      namespaced: true,
      state: () => ({
        setorAtualId: 1,
        setorAtualNome: 'Setor Mock',
        setorDetails: { id: 1, nome: 'Setor Mock' },
        listUsuariosSetor: [{ id: 1, perfil: 'admin' }],
      }),
    },
  },
  state() {
    return {
      setorAtualId: 1,
      setorDetails: { id: 1, nome: 'Setor Mock' },
      listUsuariosSetor: [{ id: 1, perfil: 'admin' }],
      user: { id: 1 },
      listPolos: [],
      listSetoresGerais: [],
      listGrupoProdutos: [],
    }
  },
  getters: {
    isSuperAdmin: () => true,
  }
});

// Componente Mocado Globalmente
const TemplateAdmin = {
  template: '<div><slot></slot></div>'
};

describe('EstoqueReport.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve incluir o parâmetro page na chamada de functionsRelatorios.listEstoqueReport', async () => {
    functionsRelatorios.listEstoqueReport.mockResolvedValue({
      success: true,
      data: { data: [ /* ... */ ], current_page: 1, last_page: 1, total: 1 },
      totalizadores: {}
    });

    const wrapper = mount(EstoqueReport, {
      global: { 
        plugins: [mockStore],
        stubs: { TemplateAdmin }
      }
    });

    await wrapper.vm.$nextTick();
    
    expect(functionsRelatorios.listEstoqueReport).toHaveBeenCalled();
    const args = functionsRelatorios.listEstoqueReport.mock.calls[0][1];
    expect(args.page).toBe(1);
  });

  it('deve resetar a página para 1 ao alterar o filters.setor_id', async () => {
    const wrapper = mount(EstoqueReport, {
      global: { 
        plugins: [mockStore],
        stubs: { TemplateAdmin }
      }
    });
    
    await wrapper.setData({ currentPage: 3, filters: { setor_id: 2 } });
    
    // Simular o trigger de change no select de setor
    const select = wrapper.findAll('select').at(1);
    await select.setValue('3');
    await select.trigger('change');
    
    expect(wrapper.vm.currentPage).toBe(1);
  });

  it('o método changePage deve atualizar o estado e disparar a requisição novamente', async () => {
    functionsRelatorios.listEstoqueReport.mockResolvedValue({
      success: true,
      data: { data: [ /* ... */ ], current_page: 2, last_page: 5, total: 50 },
      totalizadores: {}
    });

    const wrapper = mount(EstoqueReport, {
      global: { 
        plugins: [mockStore],
        stubs: { TemplateAdmin }
      }
    });
    
    await wrapper.setData({ lastPage: 5 });
    
    // Limpar as chamadas de mounted
    functionsRelatorios.listEstoqueReport.mockClear();

    wrapper.vm.changePage(2);
    
    expect(wrapper.vm.currentPage).toBe(2);
    
    await wrapper.vm.$nextTick();
    expect(functionsRelatorios.listEstoqueReport).toHaveBeenCalledTimes(1);
    const args = functionsRelatorios.listEstoqueReport.mock.calls[0][1];
    expect(args.page).toBe(2);
  });
});
