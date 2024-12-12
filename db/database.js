const { mongoose } = require('mongoose');

async function connectDB(config) {

    // Definir esquema para usuarios
    const userSchema = new mongoose.Schema({
        discord_id: { type: String, required: true, unique: true },
        osu_id: { type: String },
        main_gamemode: { type: String, default: "std" },
        osu_server: { type: String, default: "bancho" }
    });

    const User = mongoose.model('User', userSchema);
    
    const uri = `mongodb+srv://${config.DB_ADMIN}:${config.DB_PASS}@sengobot.dhm05.mongodb.net/sengo_bot?retryWrites=true&w=majority&appName=SengoBot`;

    try {
        console.log("# Conectando a MongoDB...");
        await mongoose.connect(uri);

        const res = {'status' : 1, 'response' : "# MongoDB conectado", 'User': User};
        console.log(res.response);

        return res;
    } catch (error) {
        console.error('Error al conectar a MongoDB', error);
        return { 'status': -1, 'response': "Error al conectar a MongoDB" };

    }
}
async function addUser(User, discord_id, osu_id, main_gamemode) {
    
    const gamemode = main_gamemode == "" ? 'std' : main_gamemode;
    
    try {
        
        let user = await User.findOne({ discord_id });

        if (user) {
            // Si el usuario ya existe, actualiza su osu_id y modo de juego
            user.osu_id = osu_id;
            user.main_gamemode = gamemode;

            await user.save();
            return { 'status': 1, 'response': `Usuario ${discord_id} actualizado`, 'callback': user };
        } else {
            // Si no existe, crea uno nuevo
            user = new User({ discord_id, osu_id, gamemode});
            await user.save();
            return { 'status': 1, 'response': `Usuario ${discord_id} agregado`, 'callback': user };
        }
    } catch (error) {
        console.error('Error al agregar/actualizar usuario:', error);
        return { 'status': -1, 'response': 'Error al agregar/actualizar usuario', 'callback': discord_id };
    }
}
async function deleteUser(User, discord_id) {
    try {
        // Busca y elimina al usuario por discord_id
        const user = await User.findOneAndDelete({ discord_id });

        if (user) {
            // Si el usuario existía y fue eliminado
            return { 'status': 1, 'response': `Usuario ${discord_id} eliminado`, 'callback': user };
        } else {
            // Si el usuario no fue encontrado
            return { 'status': 0, 'response': `Usuario ${discord_id} no encontrado`, 'callback': null };
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return { 'status': -1, 'response': 'Error al eliminar usuario', 'callback': discord_id };
    }
}

module.exports = {connectDB, addUser, deleteUser};