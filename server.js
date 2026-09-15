import express from "express";

import {
    exchangeRefreshTokenForAuthTokens,
    getProfileFromUserName
} from "psn-api";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const PSN_REFRESH_TOKEN = process.env.PSN_REFRESH_TOKEN;


/*
 * Obtém um novo access token usando o refresh token.
 */
async function obterAutorizacao() {

    if (!PSN_REFRESH_TOKEN) {
        throw new Error(
            "PSN_REFRESH_TOKEN não configurado no Render."
        );
    }

    const tokens =
        await exchangeRefreshTokenForAuthTokens(
            PSN_REFRESH_TOKEN
        );

    if (!tokens || !tokens.accessToken) {
        throw new Error(
            "A PSN não retornou um access token válido."
        );
    }

    console.log("Novo access token obtido.");

    return {
        accessToken: tokens.accessToken
    };
}


/*
 * Página inicial.
 */
app.get("/", (req, res) => {

    res.json({
        nome: "TrophyLeaders Backend",
        status: "online",
        psnApi: PSN_REFRESH_TOKEN
            ? "configurada"
            : "aguardando configuração"
    });

});


/*
 * TESTE REAL DA AUTENTICAÇÃO.
 *
 * Esta rota não apenas verifica se conseguimos renovar
 * o token. Ela também faz uma chamada real à PSN.
 */
app.get("/api/psn/status", async (req, res) => {

    try {

        const authorization =
            await obterAutorizacao();


        /*
         * Faz uma chamada real à PlayStation.
         *
         * Usamos o próprio usuário autenticado.
         */
        const perfil =
            await getProfileFromUserName(
                authorization,
                "me"
            );


        res.json({

            sucesso: true,

            mensagem:
                "Autenticação e chamada à PSN funcionando.",

            tokenRecebido:
                true,

            onlineId:
                perfil?.profile?.onlineId || null,

            accountId:
                perfil?.profile?.accountId || null

        });

    } catch (erro) {

        console.error(
            "ERRO REAL DA PSN:",
            erro
        );


        res.status(500).json({

            sucesso: false,

            erro:
                erro?.message ||
                "Erro desconhecido ao acessar a PSN."

        });

    }

});


/*
 * Pesquisa um PSN ID.
 */
app.get("/api/psn/:psnId", async (req, res) => {

    const psnId =
        req.params.psnId;


    if (!psnId || psnId.trim() === "") {

        return res.status(400).json({

            sucesso: false,

            erro:
                "PSN ID não informado."

        });

    }


    try {

        const authorization =
            await obterAutorizacao();


        const perfilResponse =
            await getProfileFromUserName(
                authorization,
                psnId
            );


        if (!perfilResponse?.profile) {

            return res.status(404).json({

                sucesso: false,

                erro:
                    "Perfil PSN não encontrado."

            });

        }


        res.json({

            sucesso: true,

            perfil:
                perfilResponse.profile

        });

    } catch (erro) {

        console.error(
            "Erro ao consultar PSN ID:",
            psnId,
            erro
        );


        res.status(500).json({

            sucesso: false,

            erro:
                erro?.message ||
                "Não foi possível consultar o perfil PSN."

        });

    }

});


/*
 * Inicia o servidor.
 */
app.listen(PORT, () => {

    console.log(
        `TrophyLeaders Backend rodando na porta ${PORT}`
    );

});
