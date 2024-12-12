async function run(messages, args) {
    
    let bottom = 1;
    let top = 100;

    if (args.length > 0) {
        top = parseInt(args[0]);

        if (isNaN(top)) {
            return `Error: El valor máximo (top) no es un número válido.`;
        }
    }

    if (args.length > 1) {
        bottom = parseInt(args[1]);

        if (isNaN(bottom)) {
            return `Error: El valor mínimo (bottom) no es un número válido.`;
        }
    }

    if (bottom > top) {
        return `Error: El valor mínimo (${bottom}) no puede ser mayor que el valor máximo (${top}).`;
    }

    const roll = Math.floor(Math.random() * (top - bottom + 1)) + bottom;

    return `${roll} (entre ${bottom} y ${top})`;
}

module.exports = { run }