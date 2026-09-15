import express from "express";
import {
    exchangeRefreshTokenForAuthTokens
} from "psn-api";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const PSN_REFRESH_TOKEN = process.env.PSN_REFRESH_TOKEN;

app.get("/", (req, res) => {
    res.json({
        nome: "TrophyLeaders Backend",
        status: "online",
        psnApi: PSN_REFRESH_TOKEN
            ? "configurada"
            : "aguardando configuração"
    });
});

app.get("/api/psn/status", async (req, res) => {

    if (!PSN_REFRESH_TOKEN) {
        return res.status(503).json({
            sucesso: false,
            erro: "PSN_REFRESH_TOKEN não configurado no servidor."
        });
    }

    try {

        const authorization =
            await exchangeRefreshTokenForAuthTokens(
                PSN_REFRESH_TOKEN
            );

        return res.json({
            sucesso: true,
            mensagem: "Autenticação com psn-api funcionando.",
            tokenRecebido: !!authorization.accessToken
        });

    } catch (erro) {

        console.error("Erro de autenticação PSN:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível autenticar com a PlayStation Network."
        });
    }
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
        mensagem: "PSN ID recebido. A busca será conectada na próxima etapa."
    });
});

app.listen(PORT, () => {
    console.log(
        `TrophyLeaders Backend rodando na porta ${PORT}`
    );
});
