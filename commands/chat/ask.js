async function run(message, args){

    const responses = [
        'Preguntale a alguien que si sepa',
        'No tienes nada mejor que hacer?',
        'Y si mejor tocas cesped',
        'Que pregunta es esa?',
        'Aqui no hacemos eso.',
        'Imagina preguntarle a un bot',
        'Disculpa. Yo no ando aburrido',
        'Y si eliges por ti mismo?',
        'La primera opcion sale bien',
        'No lo se. Tu dime',
        'Anda por la que menos te guste',
        'La 2',
        'Si'
    ]

    return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = { run }