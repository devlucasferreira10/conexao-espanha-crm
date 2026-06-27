'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Briefcase, CheckCircle, Clock, FileText, ArrowRight, Plane, MessageSquare, LogIn, LogOut, Lock, Mail, DollarSign, Percent, Key, User as UserIcon, Search, Calendar, Plus, Trash2, PieChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface Cliente {
  id: number;
  nome: string;
  data_contato: string;
  numero: string;
  vendedora: string;
  andamento: string;
  obs: string;
  valor: number;
  servico: string; // Novo campo integrado
}

interface Compromisso {
  id: number;
  titulo: string;
  dia_semana: string;
  horario_espanha: string;
  horario_brasil: string;
}

const ETAPAS_FUNIL = [
  'Primeiro Contato',
  'Negociação',
  'Conversa com Matheus',
  'Chegada na Espanha',
  'Migração Completa'
];

const DIAS_SEMANA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const OPCOES_SERVICO = ['Consultoria', 'Relocation', 'Ambos'];

export default function Home() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [autenticando, setAutenticando] = useState(false);
  
  const [deveTrocarSenha, setDeveTrocarSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [atualizandoSenha, setAtualizandoSenha] = useState(false);

  const [usuarioAtual, setUsuarioAtual] = useState<'admin' | 'vendedora'>('vendedora');
  const [isMatheus, setIsMatheus] = useState(false);
  const [nomeVendedoraLogada, setNomeVendedoraLogada] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  const [termoPesquisa, setTermoPesquisa] = useState('');

  // Estados do Cadastro de Cliente
  const [novoNome, setNovoNome] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novoNumero, setNovoNumero] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [servicoSelecionado, setServicoSelecionado] = useState('Consultoria');
  const [novaObs, setNovaObs] = useState('');

  // Estados da Agenda
  const [agenda, setAgenda] = useState<Compromisso[]>([]);
  const [novoTituloCompromisso, setNovoTituloCompromisso] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState('Segunda-feira');
  const [horaEspanha, setHoraEspanha] = useState('');

  async function buscarClientes() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Erro ao buscar dados:', error);
    } else if (data) {
      setClientes(data);
    }
    setCarregando(false);
  }

  async function buscarAgenda() {
    const { data, error } = await supabase
      .from('agenda')
      .select('*')
      .order('horario_espanha', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agenda:', error);
    } else if (data) {
      setAgenda(data);
    }
  }

  const configurarSessaoUsuario = useCallback((session: Session | null) => {
    setSessao(session);
    if (session?.user) {
      const email = session.user.email || '';
      
      const dataCriacao = session.user.created_at;
      const dataAtualizacao = session.user.updated_at;
      if (dataCriacao === dataAtualizacao && !email.endsWith('@admin.com')) {
        setDeveTrocarSenha(true);
      }

      if (email.toLowerCase() === 'matheus@admin.com') {
        setUsuarioAtual('admin');
        setIsMatheus(true);
        setNomeVendedoraLogada('Matheus');
      } else if (email.endsWith('@admin.com')) {
        setUsuarioAtual('admin');
        setIsMatheus(false);
        setNomeVendedoraLogada('Admin');
      } else {
        setUsuarioAtual('vendedora');
        setIsMatheus(false);
        const primeiroNome = email.split('@')[0];
        setNomeVendedoraLogada(primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1));
      }
      buscarClientes();
      buscarAgenda();
    } else {
      setClientes([]);
      setAgenda([]);
      setCarregando(false);
      setDeveTrocarSenha(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      configurarSessaoUsuario(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      configurarSessaoUsuario(session);
    });

    return () => subscription.unsubscribe();
  }, [configurarSessaoUsuario]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLogin || !senhaLogin) return alert('Preencha e-mail e senha!');
    
    setAutenticando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailLogin,
      password: senhaLogin,
    });

    if (error) {
      alert('Erro no login: ' + error.message);
    }
    setAutenticando(false);
  };

  const handleAtualizarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6) return alert('A nova senha precisa ter no mínimo 6 dígitos!');
    if (novaSenha !== confirmarNovaSenha) return alert('As senhas não coincidem!');

    setAtualizandoSenha(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });

    if (error) {
      alert('Erro ao atualizar senha: ' + error.message);
    } else {
      alert('Senha atualizada com sucesso! Bem-vinda ao CRM.');
      setDeveTrocarSenha(false);
    }
    setAtualizandoSenha(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCadastrarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !novoNumero || !novaData) return alert('Preencha Nome, Data e Número!');

    // Validação básica para garantir que não colocaram texto no lugar da data
    if (!novaData.includes('/') && novaData.length > 4 && isNaN(Number(novaData))) {
      return alert('Atenção: Insira uma data válida no campo "DATA DO CONTATO" (Ex: 26/06/2026)!');
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert([
        {
          nome: novoNome,
          data_contato: novaData,
          numero: novoNumero,
          vendedora: nomeVendedoraLogada,
          andamento: 'Primeiro Contato',
          obs: novaObs,
          valor: Number(novoValor) || 0,
          servico: servicoSelecionado
        }
      ])
      .select();

    if (error) {
      alert('Erro ao salvar no banco de dados: ' + error.message);
      console.error(error);
    } else if (data) {
      setClientes([data[0], ...clientes]);
      setNovoNome('');
      setNovaData('');
      setNovoNumero('');
      setNovoValor('');
      setNovaObs('');
      setServicoSelecionado('Consultoria');
    }
  };

  const handleAdicionarCompromisso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTituloCompromisso || !horaEspanha) return alert('Preencha o título e o horário!');

    const [horas, minutos] = horaEspanha.split(':').map(Number);
    let horasBr = horas - 5;
    if (horasBr < 0) horasBr += 24;
    
    const horaBrasilFormatada = `${String(horasBr).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('agenda')
      .insert([
        {
          titulo: novoTituloCompromisso,
          dia_semana: diaSelecionado,
          horario_espanha: horaEspanha,
          horario_brasil: horaBrasilFormatada
        }
      ])
      .select();

    if (error) {
      alert('Erro ao salvar compromisso na agenda!');
    } else if (data) {
      setAgenda([...agenda, data[0]]);
      setNovoTituloCompromisso('');
      setHoraEspanha('');
      buscarAgenda();
    }
  };

  const handleDeletarCompromisso = async (id: number) => {
    const { error } = await supabase.from('agenda').delete().eq('id', id);
    if (error) alert('Erro ao remover compromisso!');
    else setAgenda(agenda.filter(a => a.id !== id));
  };

  const mudarAndamento = async (id: number, novoAndamento: string) => {
    const { error } = await supabase
      .from('clientes')
      .update({ andamento: novoAndamento })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar status!');
      console.error(error);
    } else {
      setClientes(clientes.map(c => c.id === id ? { ...c, andamento: novoAndamento } : c));
    }
  };

  const obterProximaEtapa = (statusAtual: string) => {
    const index = ETAPAS_FUNIL.indexOf(statusAtual);
    if (index !== -1 && index < ETAPAS_FUNIL.length - 1) {
      return ETAPAS_FUNIL[index + 1];
    }
    return null;
  };

  const obterEstiloStatus = (status: string) => {
    switch (status) {
      case 'Primeiro Contato': return 'bg-slate-800 text-slate-300 border border-slate-700';
      case 'Negociação': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'Conversa com Matheus': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Chegada na Espanha': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Migração Completa': return 'bg-red-500/20 text-red-500 border border-red-500/30 font-bold';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const clientesDaSessao = usuarioAtual === 'vendedora' 
    ? clientes.filter(c => c.vendedora.toLowerCase() === nomeVendedoraLogada.toLowerCase())
    : clientes;

  const clientesFiltrados = clientesDaSessao.filter(c => {
    const termo = termoPesquisa.toLowerCase();
    const matchesNome = c.nome?.toLowerCase().includes(termo);
    const matchesNumero = c.numero?.toLowerCase().includes(termo);
    const matchesData = c.data_contato?.toLowerCase().includes(termo);
    
    return matchesNome || matchesNumero || matchesData;
  });

  const totalPrimeiroContato = clientesDaSessao.filter(c => c.andamento === 'Primeiro Contato').length;
  const totalNegociacao = clientesDaSessao.filter(c => c.andamento === 'Negociação').length;
  const totalMatheus = clientesDaSessao.filter(c => c.andamento === 'Conversa com Matheus').length;
  const totalEspanha = clientesDaSessao.filter(c => c.andamento === 'Chegada na Espanha').length;
  const totalCompleto = clientesDaSessao.filter(c => c.andamento === 'Migração Completa').length;

  const faturamentoFechado = clientes.filter(c => c.andamento === 'Migração Completa').reduce((acc, c) => acc + (c.valor || 0), 0);
  const faturamentoEmAndamento = clientes.filter(c => c.andamento !== 'Migração Completa').reduce((acc, c) => acc + (c.valor || 0), 0);
  
  const totalComissaoDevida = clientes.filter(c => c.andamento === 'Migração Completa').length * 300;
  const seuLucroLiquidoGeral = faturamentoFechado - totalComissaoDevida;

  // Lógica de cálculo segmentada por tipo de serviço para o Admin
  const totalConsultoria = clientes.filter(c => c.andamento === 'Migração Completa' && (c.servico === 'Consultoria' || !c.servico)).reduce((acc, c) => acc + (c.valor || 0), 0);
  const totalRelocation = clientes.filter(c => c.andamento === 'Migração Completa' && c.servico === 'Relocation').reduce((acc, c) => acc + (c.valor || 0), 0);
  const totalAmbos = clientes.filter(c => c.andamento === 'Migração Completa' && c.servico === 'Ambos').reduce((acc, c) => acc + (c.valor || 0), 0);

  const obterMétricasVendedoras = () => {
    const dados: { [key: string]: { brutoFechado: number; totalContratos: number } } = {};
    clientes.forEach(c => {
      const nome = c.vendedora || 'Não Informado';
      if (!dados[nome]) dados[nome] = { brutoFechado: 0, totalContratos: 0 };
      if (c.andamento === 'Migração Completa') {
        dados[nome].brutoFechado += (c.valor || 0);
        dados[nome].totalContratos += 1;
      }
    });
    return Object.entries(dados).map(([nome, valores]) => {
      const comissaoVendedora = valores.totalContratos * 300;
      return {
        nome,
        faturamentoBruto: valores.brutoFechado,
        contratosFechados: valores.totalContratos,
        comissao: comissaoVendedora,
        seuLucroLiquido: valores.brutoFechado - comissaoVendedora
      };
    });
  };

  if (!sessao) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
        <div className="absolute top-1.5 left-0 w-full h-1 bg-amber-500" />
        <div className="absolute top-2.5 left-0 w-full h-1.5 bg-red-600" />
        <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex bg-red-500/10 p-3 rounded-xl text-red-500 mb-2"><Briefcase className="h-8 w-8" /></div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Conexão Espanha</h1>
            <p className="text-sm text-slate-400">Faça login para gerenciar a migração de clientes</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">E-MAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input type="email" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} placeholder="vendedora@conexaoes.com" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">SENHA</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input type="password" value={senhaLogin} onChange={e => setSenhaLogin(e.target.value)} placeholder="••••••••" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
              </div>
            </div>
            <button type="submit" disabled={autenticando} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition shadow-md flex items-center justify-center gap-2"><LogIn className="h-4 w-4" /> {autenticando ? 'Autenticando...' : 'Entrar no Sistema'}</button>
          </form>
        </div>
      </div>
    );
  }

  if (deveTrocarSenha) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />
        <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex bg-amber-500/10 p-3 rounded-xl text-amber-500 mb-2"><Key className="h-8 w-8" /></div>
            <h1 className="text-xl font-bold text-white tracking-tight">Primeiro Acesso Detectado</h1>
            <p className="text-xs text-slate-400">Por motivos de segurança, altere a sua senha temporária para continuar.</p>
          </div>
          <form onSubmit={handleAtualizarSenha} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">NOVA SENHA (MÍNIMO 6 DÍGITOS)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Digite sua nova senha" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">CONFIRME A NOVA SENHA</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input type="password" value={confirmarNovaSenha} onChange={e => setConfirmarNovaSenha(e.target.value)} placeholder="Repita a nova senha" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <button type="submit" disabled={atualizandoSenha} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 font-bold py-2 px-4 rounded-lg text-sm transition shadow-md flex items-center justify-center gap-2">{atualizandoSenha ? 'Salvando...' : 'Definir Nova Senha'}</button>
          </form>
          <button onClick={handleLogout} className="w-full text-xs text-slate-500 hover:text-slate-300 transition text-center underline">Voltar para a tela de Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <div className="w-full h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

      <header className="border-b border-slate-800 bg-slate-950 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Briefcase className="text-red-500 h-6 w-6" />
          <span className="font-bold text-xl tracking-wider text-white uppercase">Conexão Espanha</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <UserIcon className="h-3.5 w-3.5 text-amber-500" />
            <span>Olá, <strong className="text-white">{nomeVendedoraLogada}</strong> ({isMatheus ? '👑 Diretor Matheus' : usuarioAtual === 'admin' ? '👑 Admin' : 'Vendedora'})</span>
          </div>
          <button onClick={handleLogout} className="bg-slate-800 hover:bg-red-600/20 border border-slate-700 hover:border-red-500/30 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition"><LogOut className="h-3.5 w-3.5" /> Sair</button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* CARD DA AGENDA DE COMPROMISSOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-base uppercase tracking-wider border-b border-slate-800 pb-3">
              <Calendar className="h-5 w-5" />
              <h3>Disponibilidade e Agenda da Semana (Matheus)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-1">
              {DIAS_SEMANA.map((dia) => {
                const compromissosDoDia = agenda.filter(a => a.dia_semana === dia);
                return (
                  <div key={dia} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
                    <p className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-1 uppercase tracking-wide">{dia}</p>
                    {compromissosDoDia.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-1">Nenhum horário fixado.</p>
                    ) : (
                      compromissosDoDia.map(comp => (
                        <div key={comp.id} className="flex justify-between items-center bg-slate-950/40 px-2 py-1.5 rounded border border-slate-800 text-xs">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white truncate max-w-[140px]">{comp.titulo}</p>
                            <p className="text-[10px] text-slate-400">
                              🇪🇸 <strong className="text-amber-500">{comp.horario_espanha.slice(0,5)}</strong> | 🇧🇷 <strong className="text-red-400">{comp.horario_brasil.slice(0,5)}</strong>
                            </p>
                          </div>
                          {isMatheus && (
                            <button onClick={() => handleDeletarCompromisso(comp.id)} className="text-slate-600 hover:text-red-400 p-1 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {isMatheus ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-500 font-semibold text-xs uppercase tracking-wider">
                  <Plus className="h-4 w-4" />
                  <h4>Adicionar Horário na Agenda</h4>
                </div>
                <form onSubmit={handleAdicionarCompromisso} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">COMPROMISSO / TÍTULO</label>
                    <input type="text" value={novoTituloCompromisso} onChange={e => setNovoTituloCompromisso(e.target.value)} placeholder="Ex: Call de Fechamento" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">DIA DA SEMANA</label>
                      <select value={diaSelecionado} onChange={e => setDiaSelecionado(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none">
                        {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">HORA ESPANHA (🇪🇸)</label>
                      <input type="time" value={horaEspanha} onChange={e => setHoraEspanha(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition shadow-md mt-2">Fixar na Agenda da Equipe</button>
                </form>
              </div>
              <p className="text-[10px] text-slate-500 border-t border-slate-900 pt-2 italic">A hora oficial no Brasil (Fuso -5h) será calculada e exibida de forma automática.</p>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-center items-center text-center space-y-2">
              <Clock className="text-slate-700 h-8 w-8" />
              <p className="text-xs font-semibold text-slate-400">Sincronização de Fusos</p>
              <p className="text-[11px] text-slate-500 max-w-[200px]">Consulte a tabela ao lado para agendar reuniões com os leads nos horários disponíveis do Matheus.</p>
            </div>
          )}
        </div>

        {/* RESUMOS OPERACIONAIS E GRÁFICOS DO ADMINISTRADOR */}
        {usuarioAtual === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Resumo Financeiro de Serviços</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Seu Lucro Líquido Confirmado (Bruto descontando as comissões)</p>
                  <p className="text-3xl font-bold text-red-500 mt-1">
                    R$ {seuLucroLiquidoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-red-500/10 p-3 rounded-lg text-red-500">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Pipeline Potencial Bruto (Em Aberto)</p>
                  <p className="text-3xl font-bold text-amber-500 mt-1">
                    R$ {faturamentoEmAndamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-lg text-amber-500">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* SEÇÃO NOVA: VISUALIZAÇÃO POR TIPOS DE RECEITA */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-900 pb-2">
                <PieChart className="h-4 w-4 text-red-500" />
                <h3>Faturamento por Modalidade (Contratos Fechados)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Consultoria</span>
                  <span className="text-lg font-bold text-white block mt-1">R$ {totalConsultoria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Relocation</span>
                  <span className="text-lg font-bold text-white block mt-1">R$ {totalRelocation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Ambos</span>
                  <span className="text-lg font-bold text-white block mt-1">R$ {totalAmbos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center gap-2">
                <Percent className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm text-white uppercase tracking-wider">Desempenho e Comissões (R$ 300,00 fixos por Fechamento)</h3>
              </div>
              <div className="divide-y divide-slate-800">
                {obterMétricasVendedoras().length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">Nenhum dado financeiro coletado.</p>
                ) : (
                  obterMétricasVendedoras().map((vend) => (
                    <div key={vend.nome} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-900/10 transition">
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">VENDEDORA</span>
                        <span className="text-sm font-bold text-white">{vend.nome}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-6 sm:text-right">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Bruto Fechado</span>
                          <span className="text-sm font-semibold text-slate-300">
                            R$ {vend.faturamentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-400 block uppercase tracking-wider font-semibold">Comissão Devida</span>
                          <span className="text-sm font-bold text-amber-500">
                            R$ {vend.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-500 block">({vend.contratosFechados} {vend.contratosFechados === 1 ? 'contrato' : 'contratos'})</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-red-400 block uppercase tracking-wider font-semibold">Seu Retorno</span>
                          <span className="text-sm font-bold text-red-500">
                            R$ {vend.seuLucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Fluxo do Processo ({usuarioAtual === 'vendedora' ? 'Minhas Etapas' : 'Geral'})</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">1º Contato</p>
                <p className="text-2xl font-bold text-white mt-1">{totalPrimeiroContato}</p>
              </div>
              <div className="bg-slate-800 p-2 rounded-lg text-slate-400 hidden sm:block">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Negociação</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">{totalNegociacao}</p>
              </div>
              <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500 hidden sm:block">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Com Matheus</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{totalMatheus}</p>
              </div>
              <div className="bg-amber-500/10 p-2 rounded-lg text-amber-400 hidden sm:block">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Na Espanha</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{totalEspanha}</p>
              </div>
              <div className="bg-red-500/10 p-2 rounded-lg text-red-500 hidden sm:block">
                <Plane className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between col-span-2 md:col-span-1">
              <div>
                <p className="text-xs text-slate-400 font-medium">Concluídos 🎉</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{totalCompleto}</p>
              </div>
              <div className="bg-red-500/10 p-2 rounded-lg text-red-500 hidden sm:block">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* CADASTRO DE CLIENTE COM DROP DOWN DE TIPO DE SERVIÇO */}
        {usuarioAtual === 'vendedora' && (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-red-500">
              <UserPlus className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-white">Cadastrar Novo Cliente</h2>
            </div>
            
            <form onSubmit={handleCadastrarCliente} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">NOME</label>
                  <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Ex: João Silva" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">DATA DO CONTATO</label>
                  <input type="text" value={novaData} onChange={e => setNovaData(e.target.value)} placeholder="Ex: 23/06/2026" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">NÚMERO</label>
                  <input type="text" value={novoNumero} onChange={e => setNovoNumero(e.target.value)} placeholder="Ex: (11) 99999-9999" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
                </div>
                {/* NOVO CAMPO: SELETOR DE MODALIDADE */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">TIPO DE SERVIÇO</label>
                  <select value={servicoSelecionado} onChange={e => setServicoSelecionado(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
                    {OPCOES_SERVICO.map(opcao => (
                      <option key={opcao} value={opcao}>{opcao}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">VALOR DO FECHAMENTO (R$)</label>
                  <input type="number" value={novoValor} onChange={e => setNovoValor(e.target.value)} placeholder="Ex: 3500" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">OBS (Observações)</label>
                <textarea value={novaObs} onChange={e => setNovaObs(e.target.value)} placeholder="Digite detalhes do caso..." rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 resize-none" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg text-sm transition shadow-md">Salvar Cliente</button>
              </div>
            </form>
          </div>
        )}

        {/* TABELA DE CONTATOS FILTRADOS */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-white">
                {usuarioAtual === 'admin' ? 'Painel de Monitoramento de Migração (Geral)' : 'Meus Contatos Salvos'}
              </h3>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="text"
                  value={termoPesquisa}
                  onChange={e => setTermoPesquisa(e.target.value)}
                  placeholder="Buscar por nome, telefone ou data..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 placeholder-slate-500"
                />
              </div>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1.5 rounded shrink-0 font-medium">
                {clientesFiltrados.length} listados
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {carregando ? (
              <div className="p-8 text-center text-slate-400">Carregando contatos...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase border-b border-slate-800">
                    <th className="p-4">Nome</th>
                    <th className="p-4">Data do Contato</th>
                    <th className="p-4">Número</th>
                    <th className="p-4">Serviço</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Quem Entrou em Contato</th>
                    <th className="p-4">Obs</th>
                    <th className="p-4">Andamento</th>
                    <th className="p-4 text-right">Ações de Evolução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {clientesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        {termoPesquisa ? 'Nenhum resultado encontrado para esta busca.' : 'Nenhum cliente cadastrado neste filtro.'}
                      </td>
                    </tr>
                  ) : (
                    clientesFiltrados.map((cliente) => {
                      const proximaEtapa = obterProximaEtapa(cliente.andamento);

                      return (
                        <tr key={cliente.id} className="hover:bg-slate-900/30 transition">
                          <td className="p-4 font-medium text-white">{cliente.nome}</td>
                          <td className="p-4 text-slate-400">{cliente.data_contato}</td>
                          <td className="p-4 text-slate-400">{cliente.numero}</td>
                          <td className="p-4">
                            <span className="text-xs bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300 font-medium">
                              {cliente.servico || 'Consultoria'}
                            </span>
                          </td>
                          <td className="p-4 text-amber-500 font-medium">
                            R$ {(cliente.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-medium">
                              {cliente.vendedora}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400 max-w-xs truncate" title={cliente.obs}>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span>{cliente.obs || 'Nenhuma nota'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${obterEstiloStatus(cliente.andamento)}`}>
                              {cliente.andamento}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {proximaEtapa ? (
                              <button 
                                onClick={() => mudarAndamento(cliente.id, proximaEtapa)}
                                className="text-xs bg-slate-800 text-amber-500 hover:bg-red-600/10 hover:text-red-400 px-3 py-1.5 rounded border border-slate-700 hover:border-red-500/30 transition font-medium flex items-center gap-1 ml-auto"
                              >
                                Avançar para: {proximaEtapa} <ArrowRight className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="text-xs text-red-500 font-semibold bg-red-500/10 border border-red-500/20 px-2 py-1 rounded">
                                🇪🇸 Migração Completa!
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}