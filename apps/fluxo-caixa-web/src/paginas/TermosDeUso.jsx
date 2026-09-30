import { Link } from 'react-router'
import DocumentoLegal, {
    Destaque,
    Placeholder,
} from '../componentes/DocumentoLegal.jsx'

const secoes = [
    {
        id: 'aceitacao-dos-termos',
        numero: 1,
        titulo: 'Aceitação dos Termos',
        conteudo: (
            <>
                <p>
                    Estes Termos de Uso regulam o acesso e a utilização da
                    plataforma AgroGestão. Ao criar uma conta ou utilizar a
                    plataforma, você declara ter lido e concordado com as
                    condições aqui descritas.
                </p>
                <p>
                    Caso não concorde com qualquer condição prevista neste
                    documento, não utilize a plataforma. Se você acessa a
                    plataforma em nome de uma empresa rural, escritório
                    contábil ou outra organização, declara possuir autorização
                    para representá-la e vinculá-la a estes Termos.
                </p>
                <p>
                    Este documento deve ser lido em conjunto com a{' '}
                    <Link to="/politica-de-privacidade">
                        Política de Privacidade
                    </Link>
                    , que explica como os dados pessoais são tratados durante o
                    uso do AgroGestão.
                </p>
            </>
        ),
    },
    {
        id: 'sobre-o-agrogestao',
        numero: 2,
        titulo: 'Sobre o AgroGestão',
        conteudo: (
            <>
                <p>
                    O AgroGestão é uma plataforma de gestão financeira rural,
                    pensada para conectar o produtor rural e o escritório
                    contábil ao longo de todo o ano.
                </p>
                <p>
                    Por meio da plataforma, é possível registrar movimentações
                    financeiras, vincular documentos, acompanhar pendências,
                    organizar informações por propriedade e atividade rural e
                    compartilhar essas informações com o contador de forma
                    organizada.
                </p>
                <Destaque>
                    A plataforma é um ambiente de organização e
                    compartilhamento de informações. Ela não substitui a
                    atuação de profissionais habilitados em contabilidade,
                    fiscal ou jurídico, tampouco constitui aconselhamento
                    nessas matérias.
                </Destaque>
            </>
        ),
    },
    {
        id: 'cadastro-e-utilizacao',
        numero: 3,
        titulo: 'Cadastro e Utilização da Plataforma',
        conteudo: (
            <>
                <p>
                    Para utilizar a plataforma é necessário criar uma conta,
                    fornecendo informações verdadeiras, completas e
                    atualizadas. Você é responsável pela veracidade dos dados
                    informados no cadastro.
                </p>
                <p>
                    As credenciais de acesso são pessoais e devem ser mantidas
                    em sigilo. Você é responsável por todas as atividades
                    realizadas em sua conta e deve comunicar imediatamente
                    qualquer uso não autorizado.
                </p>
                <p>
                    A conta é vinculada à pessoa ou à organização indicada no
                    cadastro e não pode ser cedida a terceiros sem
                    autorização. Para utilizar a plataforma é necessário ter
                    capacidade legal para contratar, nos termos da legislação
                    aplicável.
                </p>
            </>
        ),
    },
    {
        id: 'responsabilidades-do-usuario',
        numero: 4,
        titulo: 'Responsabilidades do Usuário',
        conteudo: (
            <>
                <p>Ao usar o AgroGestão, você se compromete a:</p>
                <ul>
                    <li>
                        manter seus dados de cadastro e as informações da sua
                        conta atualizados;
                    </li>
                    <li>
                        utilizar a plataforma de forma lícita, de boa-fé e em
                        conformidade com estes Termos e a legislação
                        aplicável;
                    </li>
                    <li>
                        revisar as informações, cálculos e documentos
                        apresentados antes de utilizá-los para tomadas de
                        decisão ou envios a terceiros;
                    </li>
                    <li>
                        garantir que possui legitimidade para inserir e
                        compartilhar informações de terceiros na plataforma,
                        quando aplicável;
                    </li>
                    <li>
                        respeitar os direitos de propriedade intelectual e de
                        outros usuários da plataforma.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'uso-adequado',
        numero: 5,
        titulo: 'Uso Adequado da Plataforma',
        conteudo: (
            <>
                <p>É vedado utilizar o AgroGestão para:</p>
                <ul>
                    <li>
                        fins ilícitos, fraudulentos ou que violem direitos de
                        terceiros;
                    </li>
                    <li>
                        introduzir vírus, código malicioso ou qualquer elemento
                        capaz de comprometer o funcionamento da plataforma;
                    </li>
                    <li>
                        tentar acessar áreas, contas ou dados aos quais não
                        tenha autorização;
                    </li>
                    <li>
                        interferir, de qualquer forma, na disponibilidade e na
                        segurança da plataforma;
                    </li>
                    <li>
                        reproduzir, revender ou explorar comercialmente a
                        plataforma sem autorização expressa;
                    </li>
                    <li>
                        inserir informações que sejam falsas, enganosas ou
                        irregularmente obtidas.
                    </li>
                </ul>
                <p>
                    O descumprimento destas regras pode levar ao encerramento
                    da conta, conforme descrito na seção 10.
                </p>
            </>
        ),
    },
    {
        id: 'informacoes-inseridas',
        numero: 6,
        titulo: 'Informações Inseridas pelo Usuário',
        conteudo: (
            <>
                <p>
                    Você é o único responsável pelas informações, cadastros e
                    documentos que insere na plataforma, incluindo sua origem,
                    veracidade e legalidade.
                </p>
                <p>
                    A plataforma organiza, calcula e apresenta conteúdos a
                    partir dessas informações. Qualquer resultado exibido
                    depende dos dados fornecidos, das regras aplicáveis e do
                    momento da consulta, e pode estar sujeito a erro caso os
                    dados de origem estejam incompletos ou desatualizados.
                </p>
                <p>
                    Ao inserir informações, você autoriza o tratamento técnico
                    necessário ao funcionamento da plataforma, nos termos da{' '}
                    <Link to="/politica-de-privacidade">
                        Política de Privacidade
                    </Link>
                    .
                </p>
            </>
        ),
    },
    {
        id: 'documentos-e-financas',
        numero: 7,
        titulo: 'Documentos e Informações Financeiras',
        conteudo: (
            <>
                <p>
                    Documentos enviados à plataforma, como notas, recibos e
                    comprovantes, permanecem sob responsabilidade de quem os
                    enviou. O AgroGestão não altera o conteúdo original desses
                    documentos.
                </p>
                <p>
                    Informações, cálculos, projeções e simulações exibidas
                    pela plataforma podem depender de dados fornecidos pelo
                    usuário, de regras aplicáveis e de critérios de
                    classificação informados no próprio cadastro ou nas
                    movimentações.
                </p>
                <Destaque>
                    O AgroGestão não presta aconselhamento contábil, fiscal ou
                    jurídico. Resultados apresentados na plataforma devem ser
                    validados por profissional habilitado antes de qualquer
                    uso oficial, envio a autoridades ou tomada de decisão
                    relevante.
                </Destaque>
            </>
        ),
    },
    {
        id: 'disponibilidade',
        numero: 8,
        titulo: 'Disponibilidade da Plataforma',
        conteudo: (
            <>
                <p>
                    Trabalhamos para manter a plataforma disponível, mas não
                    garantimos funcionamento ininterrupto. Manutenções,
                    atualizações, correções ou problemas técnicos podem
                    interromper o acesso temporariamente.
                </p>
                <p>
                    Quando possível, manutenções previstas serão comunicadas
                    com antecedência por meio dos canais de contato da
                    plataforma.
                </p>
                <p>
                    Você deve manter seu navegador e seus equipamentos
                    atualizados, pois a plataforma pode deixar de funcionar em
                    versões antigas ou não suportadas.
                </p>
            </>
        ),
    },
    {
        id: 'propriedade-intelectual',
        numero: 9,
        titulo: 'Propriedade Intelectual',
        conteudo: (
            <>
                <p>
                    A plataforma AgroGestão, incluindo seu software, marca,
                    layout, textos, imagens e demais elementos, pertence a{' '}
                    <Placeholder>[Informação a ser definida]</Placeholder> ou a
                    seus licenciantes, sendo protegida pela legislação de
                    propriedade intelectual aplicável.
                </p>
                <p>
                    Estes Termos não transferem nenhum direito de propriedade
                    sobre a plataforma, concedendo apenas uma licença de uso
                    limitada, revogável, intransferível e exclusiva para o
                    acesso conforme aqui previsto.
                </p>
                <p>
                    As informações, movimentações e documentos inseridos por
                    você permanecem de sua responsabilidade e continuam a
                    pertencer a você ou à parte que os forneceu.
                </p>
            </>
        ),
    },
    {
        id: 'encerramento-da-conta',
        numero: 10,
        titulo: 'Encerramento da Conta',
        conteudo: (
            <>
                <p>
                    Podemos encerrar sua conta quando houver descumprimento
                    destes Termos, uso indevido da plataforma, risco à
                    segurança, a outros usuários ou a terceiros, ou
                    inadimplência relativa a planos contratados, observado o
                    aviso prévio sempre que aplicável.
                </p>
                <p>
                    Você pode solicitar o encerramento da conta a qualquer
                    momento pelos canais indicados na seção 12. Após o
                    encerramento, o tratamento dos dados será realizado nos
                    termos da{' '}
                    <Link to="/politica-de-privacidade">
                        Política de Privacidade
                    </Link>
                    , observados os prazos de retenção exigidos por lei.
                </p>
                <p>
                    O encerramento da conta não isenta o usuário do pagamento
                    de valores já devidos até a data do ocorrido.
                </p>
            </>
        ),
    },
    {
        id: 'alteracoes-dos-termos',
        numero: 11,
        titulo: 'Alterações dos Termos',
        conteudo: (
            <>
                <p>
                    Estes Termos podem ser atualizados periodicamente. A versão
                    vigente é sempre esta página, com a data da última
                    atualização indicada no topo do documento.
                </p>
                <p>
                    Alterações relevantes serão comunicadas pelos canais
                    cadastrados ou por meio de{' '}
                    <Placeholder>[Informação a ser definida]</Placeholder>, com
                    antecedência razoável, quando exigido pela legislação
                    aplicável.
                </p>
                <p>
                    O uso continuado da plataforma após a vigência das novas
                    condições constitui aceitação. Caso não concorde, você deve
                    encerrar o uso e solicitar o encerramento da conta.
                </p>
            </>
        ),
    },
    {
        id: 'contato',
        numero: 12,
        titulo: 'Contato',
        conteudo: (
            <>
                <p>
                    Para dúvidas sobre estes Termos, utilize os canais abaixo:
                </p>
                <ul>
                    <li>
                        Empresa: <Placeholder>[Informação a ser definida]</Placeholder>
                    </li>
                    <li>
                        CNPJ: <Placeholder>[Informação a ser definida]</Placeholder>
                    </li>
                    <li>
                        Endereço: <Placeholder>[Informação a ser definida]</Placeholder>
                    </li>
                    <li>
                        E-mail de contato:{' '}
                        <Placeholder>[Informação a ser definida]</Placeholder>
                    </li>
                </ul>
                <p>
                    Para questões sobre dados pessoais, consulte o canal
                    específico descrito na{' '}
                    <Link to="/politica-de-privacidade">
                        Política de Privacidade
                    </Link>
                    .
                </p>
            </>
        ),
    },
]

function TermosDeUso() {
    return (
        <DocumentoLegal
            descricao="Este documento apresenta os Termos de Uso da plataforma AgroGestão, uma ferramenta de gestão financeira rural que conecta produtores e contadores. Aqui você encontra as regras de acesso e utilização, as responsabilidades de cada parte e os canais de contato. Leia com atenção antes de criar sua conta."
            etiqueta="Termos de uso"
            relacionado={{
                para: '/politica-de-privacidade',
                titulo: 'Política de Privacidade',
            }}
            secoes={secoes}
            titulo="Termos de Uso"
        />
    )
}

export default TermosDeUso
