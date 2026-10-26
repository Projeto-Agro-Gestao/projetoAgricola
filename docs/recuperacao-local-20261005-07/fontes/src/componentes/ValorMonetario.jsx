export default function ValorMonetario({ valor }) {
    if (valor === null || valor === undefined) return <span className="ag-valor-ausente">Registre movimentações para calcular</span>
    const partes = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).formatToParts(valor)
    return <>{partes.map((parte, i) => parte.type === 'currency' ? <span className="ag-valor-moeda" key={i}>{parte.value}</span> : parte.value)}</>
}
