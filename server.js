import express from "express";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.json({
        nome: "TrophyLeaders Backend",
        status: "online"
    });
});

app.get("/api/psn/:psnId", async (req, res) => {

    const psnId = req.params.psnId;

    if (!psnId || psnId.trim() === "") {
        return res.status(400).json({
            erro: "PSN ID não informado"
        });
    }

    return res.json({
        psnId: psnId,
        mensagem: "Backend funcionando. O psn-api será conectado na próxima etapa."
    });
});

app.listen(PORT, () => {
    console.log(`TrophyLeaders Backend rodando na porta ${PORT}`);
});
