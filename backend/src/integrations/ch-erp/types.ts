// Formato real confirmado em chamada de teste (a documentação Postman não
// trazia exemplo de resposta, só o corpo do POST de cadastro — que usa
// nomenclatura diferente). O envelope `result` é padrão do DataSnap
// (Delphi): sempre um array contendo um único array com os registros.

export interface ChErpCliente {
  CHAVE: number;
  CODIGO: string;
  CHAVEEMPRESA: number;
  /** 0 = pessoa jurídica (CNPJ), 1 = pessoa física (CPF) */
  PESSOA: number;
  RAZAOSOCIAL: string;
  FANTASIA: string;
  CNPJCPF: string;
  IERG: string;
  ENDERECO: string;
  NUMERO: string;
  BAIRRO: string;
  COMPLEMENTO: string;
  /** Vem como "CIDADE (UF)", ex.: "JOACABA (SC)" */
  CIDADE: string;
  UF: string;
  CEP: string;
  TELEFONE: string;
  CELULAR: string;
  EMAIL: string;
  DATANASC: string | null;
}

export interface ChErpListClientesResponse {
  result: ChErpCliente[][];
}
