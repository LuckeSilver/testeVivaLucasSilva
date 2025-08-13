import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, User, Edit, Save, X, Plus, Trash2 } from 'lucide-react';

const App = () => {
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cep: '',
    logradouro: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carrega os endereços ao iniciar
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await fetch('https://address-manager-production.up.railway.app/api/addresses');
        if (!response.ok) throw new Error('Erro ao carregar endereços');
        
        const data = await response.json();
        console.log('Addresses loaded:', data);
        
        // Formata os dados para garantir estrutura consistente
        const formattedAddresses = data.map(addr => ({
          id: addr.id,
          nome: addr.nome,
          cpf: addr.cpf,
          cep: addr.cep,
          logradouro: addr.logradouro,
          bairro: addr.bairro,
          cidade: addr.cidade,
          estado: addr.estado,
          endereco: addr.endereco || `${addr.logradouro}, ${addr.bairro}, ${addr.cidade}, ${addr.estado}`
        }));
        
        setAddresses(formattedAddresses);
      } catch (error) {
        console.error('Error loading addresses:', error);
        setError('Erro ao carregar endereços');
      }
    };

    loadAddresses();
  }, []);

  const parseEndereco = (endereco) => {
  if (!endereco) return { logradouro: '', bairro: '', cidadeEstado: '' };
  
  const parts = endereco.split(', ');
  return {
    logradouro: parts[0] || '',
    bairro: parts[1] || '',
    cidadeEstado: parts.slice(2).join(', ') || ''
  };
};

  // Busca informações do CEP na API viaCEP
  const fetchCEP = async (cep) => {
    if (cep.length !== 8) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        setError('CEP não encontrado');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      }));
    } catch (err) {
      setError('Erro ao buscar CEP');
    } finally {
      setLoading(false);
    }
  };

  // Validação de CPF
  const validateCPF = (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };

  // Formatação do CPF
  const formatCPF = (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCEP = (cep) => {
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Validação do formulário
  const validateForm = () => {
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    
    if (!validateCPF(formData.cpf)) {
      setError('CPF inválido');
      return false;
    }
    
    if (formData.cep.replace(/\D/g, '').length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return false;
    }
    
    if (!formData.logradouro.trim()) {
      setError('Logradouro é obrigatório');
      return false;
    }
    
    if (!formData.bairro.trim()) {
      setError('Bairro é obrigatório');
      return false;
    }
    
    if (!formData.cidade.trim()) {
      setError('Cidade é obrigatória');
      return false;
    }
    
    if (!formData.estado.trim()) {
      setError('Estado é obrigatório');
      return false;
    }
    
    return true;
  };

  // Salvar novo endereço
  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    const newAddress = {
      cep: formatCEP(formData.cep),
      cpf: formatCPF(formData.cpf),
      nome: formData.nome,
      logradouro: formData.logradouro,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
      endereco: `${formData.logradouro}, ${formData.bairro}, ${formData.cidade}, ${formData.estado}`
    };

    try {
      const response = await fetch('https://address-manager-production.up.railway.app/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAddress),
      });

      if (response.ok) {
        const savedAddress = await response.json();
        setAddresses(prev => [...prev, savedAddress]);
        setFormData({
          nome: '',
          cpf: '',
          cep: '',
          logradouro: '',
          bairro: '',
          cidade: '',
          estado: ''
        });
        setSuccess('Endereço salvo com sucesso!');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Falha ao salvar endereço');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      setError(`Erro ao salvar: ${error.message}`);
    }
  };

  // Iniciar edição
const startEdit = (address) => {
  console.log('Address object received:', address);
  
  if (address && address.id) {
    console.log('Starting edit for ID:', address.id);
    
    // Extrai os componentes do endereço
    const enderecoParts = address.endereco ? address.endereco.split(', ') : [];
    
    setEditingId(address.id);
    setEditData({
      nome: address.nome || '',
      cpf: address.cpf?.replace(/\D/g, '') || '',
      cep: address.cep?.replace(/\D/g, '') || '',
      logradouro: enderecoParts[0] || address.logradouro || '',
      bairro: enderecoParts[1] || address.bairro || '',
      cidade: enderecoParts[2] || address.cidade || '',
      estado: enderecoParts[3] || address.estado || ''
    });
  } else {
    console.error('Invalid address object or missing ID:', address);
    setError('ID do endereço não encontrado.');
  }
};

  // Salvar edição
  const saveEdit = async () => {
    console.log('Current editingId:', editingId);
    console.log('Current editData:', editData);
    
    setError('');
    setSuccess('');

    if (!editingId) {
      console.error('No editingId found');
      setError('ID do endereço não encontrado para edição.');
      return;
    }

    try {
      const payload = {
        nome: editData.nome,
        cpf: formatCPF(editData.cpf),
        cep: formatCEP(editData.cep),
        logradouro: editData.logradouro,
        bairro: editData.bairro,
        cidade: editData.cidade,
        estado: editData.estado,
        endereco: `${editData.logradouro}, ${editData.bairro}, ${editData.cidade}, ${editData.estado}`
      };

      console.log('Sending payload:', payload);

      const response = await fetch(`https://address-manager-production.up.railway.app/api/addresses/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(errorText || 'Erro ao atualizar endereço');
      }

      const updatedAddress = await response.json();
      console.log('Updated address:', updatedAddress);

      setAddresses(prev => prev.map(addr => 
        addr.id === editingId ? updatedAddress : addr
      ));

      setEditingId(null);
      setEditData({});
      setSuccess('Endereço atualizado com sucesso!');

    } catch (error) {
      console.error('Error in saveEdit:', error);
      setError(`Erro ao atualizar: ${error.message}`);
    }
  };

  // Cancelar edição
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Deletar endereço
  const deleteAddress = async (id) => {
    try {
      const response = await fetch(`https://address-manager-production.up.railway.app/api/addresses/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAddresses(prev => prev.filter(addr => addr.id !== id));
        setSuccess('Endereço removido com sucesso!');
      } else {
        throw new Error('Falha ao remover endereço');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      setError(`Erro ao remover: ${error.message}`);
    }
  };

  // Manipuladores de input
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'cep') {
      const cleanCEP = value.replace(/\D/g, '');
      if (cleanCEP.length === 8) {
        fetchCEP(cleanCEP);
      }
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'cep') {
      const cleanCEP = value.replace(/\D/g, '');
      if (cleanCEP.length === 8) {
        fetchEditCEP(cleanCEP);
      }
    }
  };

  // Busca CEP durante edição
  const fetchEditCEP = async (cep) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        setError('CEP não encontrado');
        return;
      }
      
      setEditData(prev => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      }));
    } catch (err) {
      setError('Erro ao buscar CEP');
    } finally {
      setLoading(false);
    }
  };

  // Limpa mensagens após 3 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mb-4">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gerenciador de Endereços
          </h1>
          <p className="text-slate-600 mt-3 text-lg">Cadastre e gerencie seus endereços com facilidade</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-0 bg-red-100 text-red-800 shadow-lg backdrop-blur-sm">
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-0 bg-emerald-100 text-emerald-800 shadow-lg backdrop-blur-sm">
            <AlertDescription className="font-medium">{success}</AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Plus className="h-5 w-5" />
              </div>
              Cadastrar Novo Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-3 text-lg pb-2 border-b border-purple-200">
                  <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  Dados Pessoais
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-slate-700 font-medium">Nome Completo *</Label>
                  <Input
                    id="nome"
                    placeholder="Digite seu nome completo"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 bg-white/70"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-slate-700 font-medium">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formatCPF(formData.cpf)}
                    onChange={(e) => handleInputChange('cpf', e.target.value.replace(/\D/g, ''))}
                    maxLength={14}
                    className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 bg-white/70"
                  />
                </div>
              </div>

              {/* Dados de Endereço */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-3 text-lg pb-2 border-b border-blue-200">
                  <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  Endereço
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-slate-700 font-medium">CEP *</Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formatCEP(formData.cep)}
                    onChange={(e) => handleInputChange('cep', e.target.value.replace(/\D/g, ''))}
                    maxLength={9}
                    className="border-slate-300 focus:border-blue-400 focus:ring-blue-400 bg-white/70"
                  />
                  {loading && <p className="text-sm text-blue-600 font-medium animate-pulse">🔍 Buscando CEP...</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logradouro" className="text-slate-700 font-medium">Logradouro *</Label>
                  <Input
                    id="logradouro"
                    placeholder="Rua, Avenida, etc."
                    value={formData.logradouro}
                    onChange={(e) => handleInputChange('logradouro', e.target.value)}
                    className="border-slate-300 focus:border-blue-400 focus:ring-blue-400 bg-white/70"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro" className="text-slate-700 font-medium">Bairro *</Label>
                <Input
                  id="bairro"
                  placeholder="Nome do bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  className="border-slate-300 focus:border-emerald-400 focus:ring-emerald-400 bg-white/70"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cidade" className="text-slate-700 font-medium">Cidade *</Label>
                <Input
                  id="cidade"
                  placeholder="Nome da cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  className="border-slate-300 focus:border-emerald-400 focus:ring-emerald-400 bg-white/70"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estado" className="text-slate-700 font-medium">Estado *</Label>
                <Input
                  id="estado"
                  placeholder="UF"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  maxLength={2}
                  className="border-slate-300 focus:border-emerald-400 focus:ring-emerald-400 bg-white/70"
                />
              </div>
            </div>

            <Button 
              onClick={handleSave}
              className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-6 px-8 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
            >
              <Plus className="h-5 w-5 mr-2" />
              Salvar Endereço
            </Button>
          </CardContent>
        </Card>

        {/* Address List */}
        {addresses.length > 0 && (
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle className="text-xl">
                📍 Endereços Salvos ({addresses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6">
                {addresses.map((address, index) => (
                  <div key={address.id} className={`border-0 rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
                    index % 3 === 0 ? 'bg-gradient-to-br from-purple-50 to-pink-50' :
                    index % 3 === 1 ? 'bg-gradient-to-br from-blue-50 to-cyan-50' :
                    'bg-gradient-to-br from-emerald-50 to-teal-50'
                  }`}>
                    {editingId === address.id ? (
                      // Edit Mode
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Editando Endereço
                          </h4>
                          <div className="flex gap-3">
                            <Button 
                              size="sm" 
                              onClick={saveEdit}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={cancelEdit}
                              className="border-slate-400 hover:bg-slate-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Nome</Label>
                            <Input
                              value={editData.nome}
                              onChange={(e) => handleEditInputChange('nome', e.target.value)}
                              className="bg-white/70"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">CPF</Label>
                            <Input
                              value={formatCPF(editData.cpf)}
                              onChange={(e) => handleEditInputChange('cpf', e.target.value.replace(/\D/g, ''))}
                              maxLength={14}
                              className="bg-white/70"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">CEP</Label>
                            <Input
                              value={formatCEP(editData.cep)}
                              onChange={(e) => handleEditInputChange('cep', e.target.value.replace(/\D/g, ''))}
                              maxLength={9}
                              className="bg-white/70"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Logradouro</Label>
                            <Input
                              value={editData.logradouro}
                              onChange={(e) => handleEditInputChange('logradouro', e.target.value)}
                              className="bg-white/70"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Bairro</Label>
                            <Input
                              value={editData.bairro}
                              onChange={(e) => handleEditInputChange('bairro', e.target.value)}
                              className="bg-white/70"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Cidade</Label>
                            <Input
                              value={editData.cidade}
                              onChange={(e) => handleEditInputChange('cidade', e.target.value)}
                              className="bg-white/70"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Estado</Label>
                            <Input
                              value={editData.estado}
                              onChange={(e) => handleEditInputChange('estado', e.target.value)}
                              maxLength={2}
                              className="bg-white/70"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-slate-800 text-lg">{address.nome}</h4>
                            <Badge variant="outline" className="mt-2 bg-white/60 text-slate-700 border-slate-300">
                              CPF: {address.cpf}
                            </Badge>
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => startEdit(address)}
                              className="hover:bg-blue-50 border-blue-300 text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => deleteAddress(address.id)}
                              className="hover:bg-red-50 border-red-300 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <Separator className="my-4 bg-slate-200" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-700 flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                              CEP
                            </p>
                            <p className="text-slate-600 ml-4">{address.cep}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-700 flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                              Logradouro
                            </p>
                            <p className="text-slate-600 ml-4">{parseEndereco(address.endereco).logradouro}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-700 flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                              Bairro
                            </p>
                            <p className="text-slate-600 ml-4">{parseEndereco(address.endereco).bairro}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-700 flex items-center gap-2">
                              <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                              Cidade/Estado
                            </p>
                            <p className="text-slate-600 ml-4">{parseEndereco(address.endereco).cidadeEstado}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {addresses.length === 0 && (
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-slate-600 text-lg font-medium mb-2">Nenhum endereço cadastrado ainda</p>
              <p className="text-slate-500">Cadastre seu primeiro endereço usando o formulário acima.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default App;