import { Link } from 'react-router'
import DocumentoLegal, {
    Destaque,
    Placeholder,
} from '../componentes/DocumentoLegal.jsx'

const secoes = [
    {
        id: 'dados-coletados',
        numero: 1,
        titulo: 'Quais Dados Podem Ser Coletados',
        conteudo: (
            <>
                <p>
                    Dependendo da forma como você utiliza a plataforma,
                    podemos tratar as seguintes categorias de dados:
                </p>
                <ul>
                    <li>
                        <strong>Dados de cadastro e conta:</strong> informações
                        informadas no registro e na gestão da conta, como nome,
                        e-mail e demais campos disponíveis nos formulários;
                    </li>
                    <li>
                        <strong>Dados cadastrais da propriedade:</strong>{' '}
                        informações sobre empresa rural, propriedades,
                        atividades rurais, fornecedores e categorias
                        cadastradas;
                    </li>
                    <li>
                        <strong>Informações financeiras:</strong>{' '}
                        movimentações de receitas e despesas, valores, contas e
                        demais registros financeiros inseridos na plataforma;
                    </li>
                    <li>
                        <strong>Documentos:</strong> notas, recibos,
                        comprovantes e outros arquivos enviados pelos
                        usuários;
                    </li>
                    <li>
                        <strong>Informações de convivência na plataforma:</strong>{' '}
                        pendências, solicitações e demais informações trocadas
                        entre produtor e contador no contexto do serviço;
                    </li>
                    <li>
                        <strong>Informações técnicas de uso:</strong>{' '}
                        registros de acesso e dados técnicos necessários à
                        operação, à segurança e à manutenção da plataforma;
                    </li>
                    <li>
                        <strong>Informações de terceiros:</strong> dados de
                        pessoas fornecidos pelo usuário (por exemplo,
                        fornecedores ou responsáveis pela propriedade), que
                        declara possuir legitimidade para informar.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'como-os-dados-sao-utilizados',
        numero: 2,
        titulo: 'Como os Dados São Utilizados',
        conteudo: (
            <>
                <p>Tratamos os dados para:</p>
                <ul>
                    <li>
                        permitir o acesso, o funcionamento e a evolução da
                        plataforma;
                    </li>
                    <li>
                        organizar as informações financeiras e documentais e
                        compartilhá-las entre produtor e contador conforme as
                        configurações e instruções do usuário;
                    </li>
                    <li>
                        prestar suporte e responder a solicitações;
                    </li>
                    <li>
                        garantir a segurança da plataforma e prevenir usos
                        indevidos;
                    </li>
                    <li>
                        gerenciar planos, assinaturas e obrigações
                        contratuais;
                    </li>
                    <li>
                        cumprir obrigações legais e regulatórias aplicáveis;
                    </li>
                    <li>
                        melhorar a experiência de uso, de forma compatível com
                        as expectativas do usuário e com a legislação.
                    </li>
                </ul>
                <p>
                    Quando o tratamento depender de consentimento, este poderá
                    ser revogado a qualquer momento, pelos canais indicados na
                    seção 11, sem prejudicar a licitude do tratamento
                    realizado anteriormente.
                </p>
            </>
        ),
    },
    {
        id: 'dados-financeiros-e-documentos',
        numero: 3,
        titulo: 'Dados Financeiros e Documentos',
        conteudo: (
            <>
                <p>
                    As informações financeiras e os documentos inseridos na
                    plataforma são tratados exclusivamente para as finalidades
                    descritas nesta Política e para o funcionamento do
                    serviço.
                </p>
                <p>
                    Esses dados são fornecidos pelos próprios usuários. A
                    veracidade, a legalidade e a atualidade das informações e
                    dos documentos são de responsabilidade de quem os inseriu.
                </p>
                <Destaque>
                    Informações, cálculos, projeções e simulações apresentados
                    pela plataforma dependem dos dados fornecidos e das regras
                    aplicáveis. Podem conter imprecisões e devem ser validados
                    por profissional habilitado antes de qualquer uso
                    relevante. O AgroGestão não presta aconselhamento contábil,
                    fiscal ou jurídico.
                </Destaque>
                <p>
                    Dados financeiros e documentos podem ser compartilhados
                    com o contador vinculado, conforme descrito na seção 5.
                </p>
            </>
        ),
    },
    {
        id: 'dados-de-produtores-e-contadores',
        numero: 4,
        titulo: 'Dados de Produtores e Contadores',
        conteudo: (
            <>
                <p>
                    A plataforma foi desenhada para que produtor e escritório
                    contábil trabalhem sobre as mesmas informações. Por meio do
                    vínculo entre as partes, cada uma pode acessar os dados
                    compartilhados no contexto da relação de trabalho.
                </p>
                <p>
                    Em relação aos dados pessoais inseridos por um usuário e
                    visíveis ao outro, cada parte atua, em regra, como
                    controladora das informações que fornece, sendo
                    responsável pelo atendimento dos direitos dos titulares
                    quanto aos seus próprios registros.
                </p>
                <p>
                    O AgroGestão atua, conforme a finalidade e o caso concreto,
                    como controladora ou como operadora, nos termos da LGPD e
                    desta Política. Titulares cujos dados foram inseridos por
                    terceiros podem contatar tanto a parte que inseriu os
                    dados quanto os canais indicados na seção 11.
                </p>
            </>
        ),
    },
    {
        id: 'compartilhamento-de-informacoes',
        numero: 5,
        titulo: 'Compartilhamento de Informações',
        conteudo: (
            <>
                <p>Os dados podem ser compartilhados:</p>
                <ul>
                    <li>
                        entre produtor e contador, em razão do vínculo
                        estabelecido na plataforma e das configurações de
                        acesso;
                    </li>
                    <li>
                        com prestadores de serviço que atuem em apoio à
                        operação da plataforma, conforme a seção 6;
                    </li>
                    <li>
                        com autoridades públicas, quando houver obrigação
                        legal ou determinação válida;
                    </li>
                    <li>
                        em operações societárias de reorganização, hipótese em
                        que as informações serão tratadas com a proteção
                        exigida pela legislação aplicável.
                    </li>
                </ul>
                <Destaque>
                    Os dados pessoais não são vendidos a terceiros.
                </Destaque>
            </>
        ),
    },
    {
        id: 'seguranca-dos-dados',
        numero: 6,
        titulo: 'Segurança dos Dados',
        conteudo: (
            <>
                <p>
                    Os dados são armazenados em infraestrutura contratada para
                    a operação da plataforma. Adotamos medidas administrativas
                    e técnicas compatíveis com os riscos envolvidos, com o
                    objetivo de proteger os dados contra acesso não autorizado,
                    perda, alteração ou divulgação indevida.
                </p>
                <p>
                    Entre as práticas adotadas estão o controle de acesso por
                    perfil, o uso de credenciais individuais e boas práticas
                    de desenvolvimento e operação do sistema.
                </p>
                <Destaque>
                    Nenhum método de transmissão ou armazenamento de dados é
                    totalmente seguro. Por isso, além de nossos esforços, é
                    fundamental que cada usuário mantenha suas credenciais em
                    sigilo e comunique qualquer suspeita de uso indevido.
                </Destaque>
            </>
        ),
    },
    {
        id: 'armazenamento-e-retencao',
        numero: 7,
        titulo: 'Armazenamento e Retenção',
        conteudo: (
            <>
                <p>
                    Os dados são mantidos enquanto a conta estiver ativa e
                    enquanto necessários para cumprir as finalidades descritas
                    nesta Política.
                </p>
                <p>
                    Após o encerramento da conta ou a solicitação de eliminação,
                    os dados poderão ser mantidos pelo tempo necessário ao
                    cumprimento de obrigações legais, regulatórias ou para a
                    composição de conflitos, observada a legislação aplicável.
                </p>
                <p>
                    Quando a lei ou a natureza do dado exigir prazo
                    específico de retenção, este será informado em{' '}
                    <Placeholder>[Informação a ser definida]</Placeholder>,
                    conforme o tipo de informação. Não mantemos dados por prazo
                    superior ao necessário às finalidades descritas nesta
                    Política.
                </p>
            </>
        ),
    },
    {
        id: 'direitos-dos-usuarios',
        numero: 8,
        titulo: 'Direitos dos Usuários (LGPD)',
        conteudo: (
            <>
                <p>
                    Nos termos da Lei Geral de Proteção de Dados (Lei nº
                    13.709/2018), o titular dos dados pessoais tem direito a:
                </p>
                <ul>
                    <li>
                        confirmar a existência de tratamento e acessar os
                        dados;
                    </li>
                    <li>
                        corrigir dados incompletos, inexatos ou desatualizados;
                    </li>
                    <li>
                        solicitar a anonimização, bloqueio ou eliminação de
                        dados desnecessários, excessivos ou tratados em
                        desconformidade;
                    </li>
                    <li>
                        solicitar a portabilidade dos dados a outro fornecedor
                        de serviço, quando cabível;
                    </li>
                    <li>
                        obter informação sobre compartilhamentos realizados;
                    </li>
                    <li>
                        revogar o consentimento, quando este for a base do
                        tratamento.
                    </li>
                </ul>
                <p>
                    Para exercer esses direitos, entre em contato com o
                    encarregado em{' '}
                    <Placeholder>[Informação a ser definida]</Placeholder>.
                    Poderemos solicitar informações adicionais para confirmar a
                    identidade do solicitante, e as respostas serão dadas nos
                    prazos previstos na legislação aplicável.
                </p>
                <p>
                    Requerimentos que digam respeito a dados inseridos por um
                    dos usuários (produtor ou contador) também podem ser
                    encaminhados diretamente a essa parte, responsável pelos
                    registros que forneceu.
                </p>
            </>
        ),
    },
    {
        id: 'cookies',
        numero: 9,
        titulo: 'Cookies',
        conteudo: (
            <>
                <p>
                    A plataforma pode utilizar cookies e tecnologias
                    semelhantes estritamente necessários ao funcionamento do
                    serviço, como manter a sessão do usuário ativa e lembrar
                    preferências essenciais.
                </p>
                <p>
                    Caso passemos a utilizar cookies não essenciais, esta
                    Política será atualizada e o usuário será informado,
                    nos termos da seção 10.
                </p>
                <p>
                    É possível gerenciar ou bloquear cookies nas configurações
                    do navegador. O bloqueio de cookies essenciais pode
                    impedir o correto funcionamento da plataforma.
                </p>
            </>
        ),
    },
    {
        id: 'alteracoes-da-politica',
        numero: 10,
        titulo: 'Alterações da Política',
        conteudo: (
            <>
                <p>
                    Esta Política pode ser atualizada para refletir mudanças
                    no serviço, na legislação ou nas práticas de tratamento de
                    dados. A versão vigente é esta página, com a data da última
                    atualização indicada no topo do documento.
                </p>
                <p>
                    Alterações relevantes serão comunicadas pelos canais
                    cadastrados ou por meio de{' '}
                    <Placeholder>[Informação a ser definida]</Placeholder>, nos
                    termos da legislação aplicável.
                </p>
                <p>
                    Recomendamos que esta Política seja consultada
                    periodicamente.
                </p>
            </>
        ),
    },
    {
        id: 'contato',
        numero: 11,
        titulo: 'Contato',
        conteudo: (
            <>
                <p>
                    Para dúvidas, solicitações ou exercício de direitos
                    relacionados a dados pessoais, utilize:
                </p>
                <ul>
                    <li>
                        Encarregado (DPO):{' '}
                        <Placeholder>[Informação a ser definida]</Placeholder>
                    </li>
                    <li>
                        Canal geral:{' '}
                        <Placeholder>[Informação a ser definida]</Placeholder>
                    </li>
                    <li>
                        Empresa: <Placeholder>[Informação a ser definida]</Placeholder>
                    </li>
                    <li>
                        CNPJ: <Placeholder>[Informação a ser definida]</Placeholder>
                    </li>
                    <li>
                        Endereço: <Placeholder>[Informação a ser definida]</Placeholder>
                    </li>
                </ul>
                <p>
                    Para regras de acesso e uso da plataforma, consulte os{' '}
                    <Link to="/termos-de-uso">Termos de Uso</Link> do
                    AgroGestão.
                </p>
            </>
        ),
    },
]

function PoliticaDePrivacidade() {
    return (
        <DocumentoLegal
            descricao="Esta Política explica como os dados pessoais são coletados, utilizados, compartilhados e protegidos quando você usa o AgroGestão, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Ela se aplica a produtores rurais, escritórios contábeis e demais usuários da plataforma."
            etiqueta="Política de privacidade"
            relacionado={{
                para: '/termos-de-uso',
                titulo: 'Termos de Uso',
            }}
            secoes={secoes}
            titulo="Política de Privacidade"
        />
    )
}

export default PoliticaDePrivacidade
