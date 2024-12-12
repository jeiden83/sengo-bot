const ping = require('ping');

async function run(message, args){
    const host = "google.com";
    let return_data;

    await ping.promise.probe(host)
    .then((res) => {

        return_data = `Ping a ${host}: ${res.time} ms`;
    })
    .catch((err) => {
        console.error('Error al hacer ping:', err);
        return_data = "Error al hacer ping";
    });


    return return_data;
}

module.exports = { run }