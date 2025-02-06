const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
    const uri = 'mongodb://54.165.171.93:27017';  // IP da sua instância EC2
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

        // Ação baseada no método HTTP
        const method = event.httpMethod;

        let response;

        switch (method) {
            case 'GET':
                // Ação de leitura (por exemplo, retornar um açaí aleatório)
                response = await getAcai(volumesCollection, tiposCollection, complementosCollection, frutasCollection, coberturasCollection, cremesCollection);
                break;

            case 'POST':
                // Ação de criação (adicionar um novo item à coleção)
                response = await createAcai(event, volumesCollection, tiposCollection, complementosCollection, frutasCollection, coberturasCollection, cremesCollection);
                break;

            case 'PUT':
                // Ação de atualização (atualizar um item específico)
                response = await updateAcai(event, volumesCollection, tiposCollection, complementosCollection, frutasCollection, coberturasCollection, cremesCollection);
                break;

            case 'DELETE':
                // Ação de deleção (deletar um item específico)
                response = await deleteAcai(event, volumesCollection, tiposCollection, complementosCollection, frutasCollection, coberturasCollection, cremesCollection);
                break;

            default:
                response = {
                    statusCode: 405,
                    body: JSON.stringify({ message: `Método ${method} não permitido` }),
                };
                break;
        }

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

// Função de GET - Retornar um açaí aleatório
const getAcai = async (volumesCollection, tiposCollection, complementosCollection, frutasCollection, coberturasCollection, cremesCollection) => {
    const volume = await volumesCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
    const tipo = await tiposCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
    const fruta = await frutasCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
    const cobertura = await coberturasCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
    const creme = await cremesCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
    
    const numComplementos = Math.floor(Math.random() * 5) + 1; // Gera entre 1 e 5
    const complementos = await complementosCollection.aggregate([{ $sample: { size: numComplementos } }]).toArray();

    return {
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
};

// Função de POST - Criar novo item
const createAcai = async (event, volumesCollection, tiposCollection, complementosCollection, frutasCollection, coberturasCollection, cremesCollection) => {
    const body = JSON.parse(event.body);

    // Criar e inserir dados nas coleções adequadas
    const volume = await volumesCollection.insertOne({ nome: body.volume });
    const tipo = await tiposCollection.insertOne({ nome: body.tipo });
    const fruta = await frutasCollection.insertOne({ nome: body.fruta });
    const cobertura = await coberturasCollection.insertOne({ nome: body.cobertura });
    const creme = await cremesCollection.insertOne({ nome: body.creme });

    // Adicionando complementos (presumindo que o corpo tem um array de complementos)
    const complementos = await complementosCollection.insertMany(body.complementos.map(c => ({ nome: c })));

    return {
        statusCode: 201,
        body: JSON.stringify({
            message: 'Açaí criado com sucesso!',
            volume: volume.ops[0], // Retorna o volume inserido
            tipo: tipo.ops[0], // Retorna o tipo inserido
            fruta: fruta.ops[0], // Retorna a fruta inserida
            cobertura: cobertura.ops[0], // Retorna a cobertura inserida
            creme: creme.ops[0], // Retorna o creme inserido
            complementos: complementos.ops // Retorna os complementos inseridos
        }),
    };
};


// Função de PUT - Atualizar item
const updateAcai = async (event, volumesCollection, tiposCollection, complementosCollection, frutasCollection, coberturasCollection, cremesCollection) => {
    const body = JSON.parse(event.body);
    const acaiId = event.pathParameters.id; // ID do açaí que será atualizado

    // Atualizar dados nas coleções adequadas
    const volumeUpdate = await volumesCollection.updateOne(
        { _id: acaiId },
        { $set: { nome: body.volume } }
    );
    const tipoUpdate = await tiposCollection.updateOne(
        { _id: acaiId },
        { $set: { nome: body.tipo } }
    );
    const frutaUpdate = await frutasCollection.updateOne(
        { _id: acaiId },
        { $set: { nome: body.fruta } }
    );
    const coberturaUpdate = await coberturasCollection.updateOne(
        { _id: acaiId },
        { $set: { nome: body.cobertura } }
    );
    const cremeUpdate = await cremesCollection.updateOne(
        { _id: acaiId },
        { $set: { nome: body.creme } }
    );

    // Atualizar os complementos
    // Substitui os complementos antigos pelos novos
    const complementosUpdate = await complementosCollection.updateOne(
        { acaiId: acaiId },
        { $set: { complementos: body.complementos } }
    );

    // Verifica se algum documento foi alterado
    if (volumeUpdate.modifiedCount === 0 && tipoUpdate.modifiedCount === 0 && frutaUpdate.modifiedCount === 0 &&
        coberturaUpdate.modifiedCount === 0 && cremeUpdate.modifiedCount === 0 && complementosUpdate.modifiedCount === 0) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Açaí não encontrado ou nenhum dado foi alterado." }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Açaí atualizado com sucesso!",
            volume: body.volume,
            tipo: body.tipo,
            fruta: body.fruta,
            cobertura: body.cobertura,
            creme: body.creme,
            complementos: body.complementos
        }),
    };
};


// Função de DELETE - Deletar item
const deleteAcai = async (event, volumesCollection, tiposCollection, complementosCollection, frutasCollection, coberturasCollection, cremesCollection) => {
    const acaiId = event.pathParameters.id; // ID do açaí que será deletado

    try {
        // Deletar dados nas coleções relevantes
        const volumeDelete = await volumesCollection.deleteOne({ _id: acaiId });
        const tipoDelete = await tiposCollection.deleteOne({ _id: acaiId });
        const frutaDelete = await frutasCollection.deleteOne({ _id: acaiId });
        const coberturaDelete = await coberturasCollection.deleteOne({ _id: acaiId });
        const cremeDelete = await cremesCollection.deleteOne({ _id: acaiId });
        const complementosDelete = await complementosCollection.deleteOne({ acaiId: acaiId }); // Supondo que açaí tenha referência nos complementos

        // Verificar se algum documento foi deletado
        if (volumeDelete.deletedCount === 0 && tipoDelete.deletedCount === 0 && frutaDelete.deletedCount === 0 &&
            coberturaDelete.deletedCount === 0 && cremeDelete.deletedCount === 0 && complementosDelete.deletedCount === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Açaí não encontrado." }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Açaí deletado com sucesso!" }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Erro ao deletar o açaí." }),
        };
    }
};

