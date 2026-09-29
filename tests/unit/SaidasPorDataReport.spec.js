import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SaidasPorDataReport from '@/views/relatorios/SaidasPorDataReport.vue';
import functionsRelatorios from '@/functions/cad_relatorios.js';
import functionsPolos from '@/functions/cad_unidades_polos.js';
import functionsSetores from '@/functions/cad_setores.js';
import { createStore } from 'vuex';

vi.mock('@/functions/cad_relatorios.js', () => ({
  default: { listSaidasPorDataReport: vi.fn() }
}));
vi.mock('@/functions/cad_unidades_polos.js', () => ({
  default: { listAll: vi.fn() }
}));
vi.mock('@/functions/cad_setores.js', () => ({
  default: { listAll: vi.fn() }
}));

const mockStore = createStore({
  modules: {
    cadastros: {
      namespaced: true,
      state: () => ({
        listPolos: [],
        listSetoresGerais: [],
      }),
    },
  },
  state() {
    return {
      listPolos: [],
      listSetoresGerais: [],
    }
  }
});

const TemplateAdmin = {
  template: '<div><slot></slot></div>'
};

describe('SaidasPorDataReport.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve incluir o parâmetro page na chamada de functionsRelatorios.listSaidasPorDataReport', async () => {
    functionsRelatorios.listSaidasPorDataReport.mockResolvedValue({
      success: true,
      data: { data: [ /* ... */ ], current_page: 1, last_page: 1, total: 1 },
      periodo: null
    });

    const wrapper = mount(SaidasPorDataReport, {
      global: { 
        plugins: [mockStore],
        stubs: { TemplateAdmin }
      }
    });

    await wrapper.vm.$nextTick();
    
    expect(functionsRelatorios.listSaidasPorDataReport).toHaveBeenCalled();
    const args = functionsRelatorios.listSaidasPorDataReport.mock.calls[0][1];
    expect(args.page).toBe(1);
  });

  it('deve resetar a página para 1 ao alterar o filters.setor_id', async () => {
    const wrapper = mount(SaidasPorDataReport, {
      global: { 
        plugins: [mockStore],
        stubs: { TemplateAdmin }
      }
    });
    
    await wrapper.setData({ currentPage: 3, filters: { setor_id: 2 } });
    
    // O select de setor é o segundo do componente
    const select = wrapper.findAll('select').at(1);
    await select.setValue('3');
    await select.trigger('change');
    
    expect(wrapper.vm.currentPage).toBe(1);
  });

  it('o método changePage deve atualizar o estado e disparar a requisição novamente', async () => {
    functionsRelatorios.listSaidasPorDataReport.mockResolvedValue({
      success: true,
      data: { data: [ /* ... */ ], current_page: 2, last_page: 5, total: 50 },
      periodo: null
    });

    const wrapper = mount(SaidasPorDataReport, {
      global: { 
        plugins: [mockStore],
        stubs: { TemplateAdmin }
      }
    });
    
    await wrapper.setData({ lastPage: 5 });
    
    // Limpar as chamadas ocorridas no mounted
    functionsRelatorios.listSaidasPorDataReport.mockClear();

    wrapper.vm.changePage(2);
    
    expect(wrapper.vm.currentPage).toBe(2);
    
    await wrapper.vm.$nextTick();
    expect(functionsRelatorios.listSaidasPorDataReport).toHaveBeenCalledTimes(1);
    const args = functionsRelatorios.listSaidasPorDataReport.mock.calls[0][1];
    expect(args.page).toBe(2);
  });
});
