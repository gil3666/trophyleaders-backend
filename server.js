import express from "express";

import {
    exchangeRefreshTokenForAuthTokens,
    getProfileFromUserName,
    getUserTrophyProfileSummary,
    getUserTitles
} from "psn-api";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const PSN_REFRESH_TOKEN = process.env.PSN_REFRESH_TOKEN;

/*
 * Obtém uma autorização nova usando o refresh token
 * armazenado no Render.
 */
async function obterAutorizacao() {

    if (!PSN_REFRESH_TOKEN) {
        throw new Error(
            "PSN_REFRESH_TOKEN não configurado no servidor."
        );
    }

    const authorization =
        await exchangeRefreshTokenForAuthTokens(
            PSN_REFRESH_TOKEN
        );

    return {
        accessToken: authorization.accessToken
    };
}


/*
 * Página inicial
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
 * Verificação da autenticação
 */
app.get("/api/psn/status", async (req, res) => {

    try {

        const authorization =
            await obterAutorizacao();

        res.json({
            sucesso: true,
            mensagem: "Autenticação com psn-api funcionando.",
            tokenRecebido: !!authorization.accessToken
        });

    } catch (erro) {

        console.error(
            "Erro de autenticação PSN:",
            erro
        );

        res.status(500).json({
            sucesso: false,
            erro: erro.message
        });

    }

});


/*
 * Pesquisa o perfil pelo PSN ID.
 *
 * Exemplo:
 *
 * /api/psn/GilRH7x
 */
app.get("/api/psn/:psnId", async (req, res) => {

    const psnId = req.params.psnId;

    if (!psnId || psnId.trim() === "") {

        return res.status(400).json({
            sucesso: false,
            erro: "PSN ID não informado."
        });

    }

    try {

        console.log(
            `Pesquisando PSN ID: ${psnId}`
        );

        /*
         * Obtém um access token novo.
         */
        const authorization =
            await obterAutorizacao();


        /*
         * Busca o perfil pelo PSN ID.
         *
         * Essa resposta contém o accountId.
         */
        const perfilResponse =
            await getProfileFromUserName(
                authorization,
                psnId
            );


        const perfil =
            perfilResponse.profile;


        if (!perfil) {

            return res.status(404).json({
                sucesso: false,
                erro: "Perfil PSN não encontrado."
            });

        }


        const accountId =
            perfil.accountId;


        console.log(
            `Account ID encontrado: ${accountId}`
        );


        /*
         * Busca o resumo geral de troféus.
         */
        const resumo =
            await getUserTrophyProfileSummary(
                authorization,
                accountId
            );


        /*
         * Busca os jogos/títulos associados
         * à conta.
         */
        const jogosResponse =
            await getUserTitles(
                authorization,
                accountId
            );


        /*
         * Mostra no log a quantidade recebida.
         */
        console.log(
            `Jogos encontrados: ${
                jogosResponse.trophyTitles
                    ? jogosResponse.trophyTitles.length
                    : 0
            }`
        );


        /*
         * Converte os dados da PSN para o formato
         * que o nosso aplicativo Android espera.
         */
        const jogos =
            (jogosResponse.trophyTitles || [])
                .map((jogo) => {

                    const earned =
                        jogo.earnedTrophies || {};

                    const defined =
                        jogo.definedTrophies || {};


                    const total =
                        Number(defined.platinum || 0) +
                        Number(defined.gold || 0) +
                        Number(defined.silver || 0) +
                        Number(defined.bronze || 0);


                    const obtidos =
                        Number(earned.platinum || 0) +
                        Number(earned.gold || 0) +
                        Number(earned.silver || 0) +
                        Number(earned.bronze || 0);


                    const progresso =
                        total > 0
                            ? Math.round(
                                (obtidos / total) * 100
                            )
                            : 0;


                    return {

                        titulo:
                            jogo.trophyTitleName || "",

                        progresso: progresso,

                        imagem:
                            jogo.trophyTitleIconUrl || "",

                        plataforma:
                            jogo.trophyTitlePlatform || "",

                        trofeusTotal:
                            total,

                        trofeusObtidos:
                            obtidos,

                        platinas:
                            Number(
                                earned.platinum || 0
                            ),

                        ouros:
                            Number(
                                earned.gold || 0
                            ),

                        pratas:
                            Number(
                                earned.silver || 0
                            ),

                        bronzes:
                            Number(
                                earned.bronze || 0
                            )
                    };

                });


        /*
         * Monta o perfil final.
         */
        const resultado = {

            psnId:
                perfil.onlineId || psnId,

            accountId:
                accountId,

            nivel:
                Number(
                    resumo.trophyLevel || 0
                ),

            totalJogos:
                jogos.length,

            platinas:
                Number(
                    resumo.earnedTrophies?.platinum || 0
                ),

            ouros:
                Number(
                    resumo.earnedTrophies?.gold || 0
                ),

            pratas:
                Number(
                    resumo.earnedTrophies?.silver || 0
                ),

            bronzes:
                Number(
                    resumo.earnedTrophies?.bronze || 0
                ),

            jogos:
                jogos

        };


        res.json({
            sucesso: true,
            perfil: resultado
        });


    } catch (erro) {

        console.error(
            "Erro ao consultar PSN:",
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
