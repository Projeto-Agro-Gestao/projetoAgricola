import {
    motion,
    useReducedMotion,
} from 'motion/react'

function Revelar({
    as: Elemento = 'div',
    atraso = 0,
    className = '',
    children,
    ...props
}) {
    const reduzirMovimento = useReducedMotion()
    const Componente = motion[Elemento] ?? motion.div

    return (
        <Componente
            className={className}
            initial={reduzirMovimento ? false : { opacity: 0, y: 24 }}
            transition={{
                duration: 0.7,
                delay: atraso / 1000,
                ease: [0.16, 1, 0.3, 1],
            }}
            viewport={{ once: true, amount: 0.15 }}
            whileInView={{ opacity: 1, y: 0 }}
            {...props}
        >
            {children}
        </Componente>
    )
}

export default Revelar
