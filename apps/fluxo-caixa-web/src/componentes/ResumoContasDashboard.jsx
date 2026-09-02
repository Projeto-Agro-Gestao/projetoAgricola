import './ResumoContasDashboard.css'

function formatarDinheiro(valor) {
    return new Intl.NumberFormat(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL',
        },
    ).format(valor ?? 0)
}

function ResumoContasDashboard({
                                   resumo,
                                   aoAbrirContas,
                               }) {
    const totalAReceber =
        Number(
            resumo?.totalAReceber
            ?? 0,
        )

    const totalAPagar =
        Number(
            resumo?.totalAPagar
            ?? 0,
        )

    const diferencaPrevista =
        Number(
            resumo?.diferencaPrevista
            ?? 0,
        )

    const quantidadeAReceber =
        Number(
            resumo?.quantidadeContasAReceber
            ?? 0,
        )

    const quantidadeAPagar =
        Number(
            resumo?.quantidadeContasAPagar
            ?? 0,
        )

    const quantidadeLembretes =
        Number(
            resumo?.quantidadeLembretes
            ?? 0,
        )

    const quantidadeVencidas =
        Number(
            resumo?.quantidadeVencidas
            ?? 0,
        )

    const previsaoNegativa =
        diferencaPrevista < 0

    return (
        <section className="dashboard-contas-painel">
            <div className="dashboard-contas-topo">
                <div>
                    <p className="dashboard-etiqueta">
                        Planejamento financeiro
                    </p>

                    <h2>
                        Contas a pagar e receber
                    </h2>

                    <p>
                        Veja o dinheiro previsto
                        para entrar, o que deverá
                        sair e a diferença esperada.
                    </p>
                </div>

                <button
                    className="dashboard-botao"
                    onClick={aoAbrirContas}
                    type="button"
                >
                    Abrir contas
                </button>
            </div>

            <div className="dashboard-contas-resumo">
                <article
                    className={
                        'dashboard-conta-indicador '
                        + 'dashboard-conta-receber'
                    }
                >
                    <div className="dashboard-conta-indicador-topo">
                        <span>
                            A receber
                        </span>

                        <i aria-hidden="true">
                            ↓
                        </i>
                    </div>

                    <strong>
                        {formatarDinheiro(
                            totalAReceber,
                        )}
                    </strong>

                    <small>
                        {quantidadeAReceber}{' '}
                        {quantidadeAReceber === 1
                            ? 'conta pendente'
                            : 'contas pendentes'}
                    </small>
                </article>

                <article
                    className={
                        'dashboard-conta-indicador '
                        + 'dashboard-conta-pagar'
                    }
                >
                    <div className="dashboard-conta-indicador-topo">
                        <span>
                            A pagar
                        </span>

                        <i aria-hidden="true">
                            ↑
                        </i>
                    </div>

                    <strong>
                        {formatarDinheiro(
                            totalAPagar,
                        )}
                    </strong>

                    <small>
                        {quantidadeAPagar}{' '}
                        {quantidadeAPagar === 1
                            ? 'conta pendente'
                            : 'contas pendentes'}
                    </small>
                </article>

                <article
                    className={
                        'dashboard-conta-indicador '
                        + (
                            previsaoNegativa
                                ? 'dashboard-conta-negativa'
                                : 'dashboard-conta-positiva'
                        )
                    }
                >
                    <div className="dashboard-conta-indicador-topo">
                        <span>
                            Diferença prevista
                        </span>

                        <i aria-hidden="true">
                            R$
                        </i>
                    </div>

                    <strong>
                        {formatarDinheiro(
                            diferencaPrevista,
                        )}
                    </strong>

                    <small>
                        {previsaoNegativa
                            ? 'Previsão de saída maior que a entrada'
                            : 'Previsão de entrada menos a saída'}
                    </small>
                </article>
            </div>

            <div className="dashboard-contas-alertas">
                <button
                    onClick={aoAbrirContas}
                    type="button"
                >
                    <span
                        aria-hidden="true"
                        className="dashboard-alerta-icone"
                    >
                        !
                    </span>

                    <div>
                        <strong>
                            {quantidadeLembretes}{' '}
                            {quantidadeLembretes === 1
                                ? 'lembrete'
                                : 'lembretes'}
                        </strong>

                        <small>
                            Contas próximas do
                            vencimento
                        </small>
                    </div>
                </button>

                <button
                    className={
                        quantidadeVencidas > 0
                            ? 'dashboard-alerta-vencido'
                            : ''
                    }
                    onClick={aoAbrirContas}
                    type="button"
                >
                    <span
                        aria-hidden="true"
                        className="dashboard-alerta-icone"
                    >
                        ×
                    </span>

                    <div>
                        <strong>
                            {quantidadeVencidas}{' '}
                            {quantidadeVencidas === 1
                                ? 'conta vencida'
                                : 'contas vencidas'}
                        </strong>

                        <small>
                            Contas que precisam
                            de atenção
                        </small>
                    </div>
                </button>
            </div>
        </section>
    )
}

export default ResumoContasDashboard