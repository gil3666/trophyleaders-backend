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

async function obterAutorizacao() {

    if (!PSN_REFRESH_TOKEN) {
        throw new Error(
            "PSN_REFRESH_TOKEN não configurado no Render."
        );
    }

    const authorization =
        await exchangeRefreshTokenForAuthTokens(
            PSN_REFRESH_TOKEN
        );

    if (
        !authorization ||
        !authorization.accessToken
    ) {
        throw new Error(
            "A PSN não retornou um access token válido."
        );
    }

    return {
        accessToken: authorization.accessToken
    };
}


app.get("/", (req, res) => {

    res.json({
        nome: "TrophyLeaders Backend",
        status: "online"
    });

});


app.get("/api/psn/status", async (req, res) => {

    try {

        const authorization =
            await obterAutorizacao();

        const perfil =
            await getProfileFromUserName(
                authorization,
                "me"
            );

        res.json({

            sucesso: true,

            mensagem:
                "Conexão com a PSN funcionando.",

            onlineId:
                perfil?.profile?.onlineId || null,

            accountId:
                perfil?.profile?.accountId || null

        });

    } catch (erro) {

        console.error(
            "ERRO PSN:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            erro:
                erro?.message ||
                "Erro ao acessar a PSN."

        });

    }

});


app.get("/api/psn/:psnId", async (req, res) => {

    const psnId =
        req.params.psnId?.trim();

    if (!psnId) {

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


        const perfil =
            perfilResponse.profile;


        let resumo = null;

        try {

            resumo =
                await getUserTrophyProfileSummary(
                    authorization,
                    perfil.accountId
                );

        } catch (erroResumo) {

            console.error(
                "Erro ao obter resumo de troféus:",
                erroResumo
            );

        }


        let jogos = [];

        try {

            const jogosResponse =
                await getUserTitles(
                    authorization,
                    perfil.accountId,
                    {
                        limit: 100
                    }
                );

            jogos =
                jogosResponse?.trophyTitles || [];

        } catch (erroJogos) {

            console.error(
                "Erro ao obter jogos:",
                erroJogos
            );

        }


        res.json({

            sucesso: true,

            perfil: {

                psnId:
                    perfil.onlineId || psnId,

                accountId:
                    perfil.accountId || null,

                avatar:
                    perfil.avatarUrl || null,

                nivel:
                    resumo?.trophyLevel || 0,

                progresso:
                    resumo?.progress || 0,

                platinas:
                    resumo?.earnedTrophies?.platinum || 0,

                ouros:
                    resumo?.earnedTrophies?.gold || 0,

                pratas:
                    resumo?.earnedTrophies?.silver || 0,

                bronzes:
                    resumo?.earnedTrophies?.bronze || 0,

                totalJogos:
                    jogos.length,

                jogos:
                    jogos.map(jogo => ({

                        titulo:
                            jogo.trophyTitleName || "",

                        imagem:
                            jogo.trophyTitleIconUrl || "",

                        plataforma:
                            jogo.trophyTitlePlatform || "",

                        trofeusTotal:
                            jogo.definedTrophies?.bronze +
                            jogo.definedTrophies?.silver +
                            jogo.definedTrophies?.gold +
                            jogo.definedTrophies?.platinum || 0,

                        trofeusObtidos:
                            jogo.earnedTrophies?.bronze +
                            jogo.earnedTrophies?.silver +
                            jogo.earnedTrophies?.gold +
                            jogo.earnedTrophies?.platinum || 0,

                        platinas:
                            jogo.earnedTrophies?.platinum || 0,

                        ouros:
                            jogo.earnedTrophies?.gold || 0,

                        pratas:
                            jogo.earnedTrophies?.silver || 0,

                        bronzes:
                            jogo.earnedTrophies?.bronze || 0

                    }))

                }

            }

        });

    } catch (erro) {

        console.error(
            "ERRO AO CONSULTAR PSN ID:",
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


app.listen(PORT, () => {

    console.log(
        `TrophyLeaders Backend rodando na porta ${PORT}`
    );

});
