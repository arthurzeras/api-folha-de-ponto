import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import * as handlers from './handlers.mjs';
import swaggerUi from 'swagger-ui-express';

const router = express.Router();
const swaggerSpecs = swaggerJSDoc({
  apis: ['src/handlers.mjs', 'src/router.mjs'],
  definition: {
    openapi: '3.0.0',
    info: {
      description: 'Esta é uma simples API de controle de ponto',
      version: '1.0.0',
      title: 'Controle de Ponto API',
      contact: {
        email: 'arthurolvmorais@gmail.com',
      },
    },
  },
});

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpecs));

/**
 * @swagger
 * definitions:
 *   Batida:
 *     type: object
 *     description: Batida de ponto
 *     properties:
 *       momento:
 *         type: string
 *         description: Momento da batida
 *         example: "2018-08-22T08:00:00"
 *   Expediente:
 *    type: object
 *    description: Jornada diária de trabalho
 *    properties:
 *      dia:
 *        type: string
 *        format: date
 *      pontos:
 *        type: array
 *        example: ["08:00:00", "12:00:00", "13:00:00", "18:00:00"]
 *        items:
 *          type: string
 *   Relatorio:
 *    type: object
 *    description: Relatório mensal
 *    properties:
 *      mes:
 *        format: ISO 8601.Duration
 *        type: string
 *        example: 2018-08
 *      horasTrabalhadas:
 *        format: ISO 8601.Duration
 *        type: string
 *        example: PT69H35M5S
 *      horasExcedentes:
 *        type: string
 *        example: PT25M5S
 *      horasDevidas:
 *        format: ISO 8601.Duration
 *        type: string
 *        example: PT0S
 *      expedientes:
 *        type: array
 *        items:
 *          $ref: '#/definitions/Expediente'
 *   Erro:
 *    type: object
 *    properties:
 *      mensagem:
 *        type: string
 */

/**
 * @swagger
 * /batidas:
 *  post:
 *    tags:
 *      - "Batidas"
 *    summary: Bater ponto
 *    description: Registrar um horário da jornada diária de trabalho
 *    produces:
 *      - application/json
 *    parameters:
 *      - in: body
 *        schema:
 *          type: object
 *          $ref: '#/definitions/Batida'
 *    responses:
 *      201:
 *        description: Created
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/definitions/Expediente"
 *      400:
 *        description: Bad Request
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/definitions/Erro"
 *            examples:
 *              Almoço:
 *                value:
 *                  mensagem: Deve haver no mínimo 1 hora de almoço
 *              Campo Obrigatório:
 *                value:
 *                  mensagem: O parâmetro "momento" é obrigatório
 *              Formato Inválido:
 *                value:
 *                  mensagem: O parâmetro "momento" precisa ser uma data válida no formato YYYY-MM-DDTHH:mm:ss
 *              4 Horários:
 *                value:
 *                  mensagem: Apenas 4 horários podem ser registrados por dia
 *              Sábado/Domingo:
 *                value:
 *                  mensagem: Sábado e domingo não são permitidos como dia de trabalho
 *      409:
 *        description: Conflict
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/definitions/Erro"
 *            examples:
 *              Horário já registrado:
 *                value:
 *                  mensagem: Horário já registrado
 */
router.post('/batidas', handlers.registerHandler);

/**
 * @swagger
 * /v1/folhas-de-ponto/{mes}:
 *   get:
 *    tags:
 *      - Folhas de Ponto
 *    summary: "Relatório mensal"
 *    description: "Geração de relatório mensal de usuário."
 *    parameters:
 *      - name: mes
 *        in: path
 *        required: true
 *        schema:
 *          type: string
 *          example: "2018-08"
 *    responses:
 *      200:
 *        description: Relatório mensal
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/definitions/Relatorio"
 *      404:
 *        description: Relatório não encontrado
 */
router.get('/folhas-de-ponto/:mes', handlers.reportHandler);

export default router;
