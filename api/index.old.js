const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
    const uri = 'mongodb://54.165.171.93:27017';  // Insira o IP da sua instância EC2
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Conectar ao MongoDB
        await client.connect();
        const database = client.db('acai_db');

        // Definir as coleções
        const volumesCollection = database.collection('volumes');
        const tiposCollection = database.collection('tipos');
        const complementosCollection = database.collection('complementos');
        const frutasCollection = database.collection('frutas');
        const coberturasCollection = database.collection('coberturas');
        const cremesCollection = database.collection('cremes');

        // Sortear um item de cada coleção
        const volume = await volumesCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
        const tipo = await tiposCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
        const fruta = await frutasCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
        const cobertura = await coberturasCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
        const creme = await cremesCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
        
        // Sorteia aleatoriamente de 1 a 5 complementos
        const numComplementos = Math.floor(Math.random() * 5) + 1; // Gera entre 1 e 5
        const complementos = await complementosCollection.aggregate([{ $sample: { size: numComplementos } }]).toArray();

        // Criar a resposta com os itens sorteados
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                volume: volume[0]?.nome,
                tipo: tipo[0]?.nome,
                creme: creme[0]?.nome,
                complementos: complementos.map(c => c.nome),
                fruta: fruta[0]?.nome,
                cobertura: cobertura[0]?.nome,
            }),
        };

        return response;
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Erro ao acessar o banco de dados." }),
        };
    } finally {
        await client.close();
    }
};
