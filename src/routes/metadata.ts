import { Router, Request, Response } from 'express';
import { checkSecFetchDest } from '../services/util';

export const metaDataRouter = Router();

/**
 * Web identity metadata route.
 * Provides web identity metadata for supported IDP origins.
 * @see https://fedidcg.github.io/FedCM/#idp-api-well-known
 * @route GET /.well-known/web-identity
 */
// https://w3c-fedid.github.io/FedCM/#idp-api-well-known
//(a) without cookies,
// (b) with the Sec-Fetch-Dest header set to webidentity, 
// and (c) without revealing the RP in the Origin or Referer headers. 
/*
GET /.well-known/web-identity HTTP/1.1
Host: idp.example
Accept: application/json
Sec-Fetch-Dest: webidentity
*/
metaDataRouter.get('/.well-known/web-identity', checkSecFetchDest, (req: Request, res: Response) => {
    const hostname = req.hostname;

    // Determine origin based on the host (hostname incl. port) and scheme
    // Note this is only needed to support multiple IDPs in parallel (otherwise could be set from the config file)
    const host = req.get('host');
    const baseUrl = `${req.protocol}://${host}`;

    if (req.supportedIDPOrigins.includes(hostname)) {
        /*  Supposed to return this but this should be dynamic based on the host header value
            dictionary IdentityProviderWellKnown {
                sequence < USVString > provider_urls;
                USVString accounts_endpoint;
                USVString login_url;
            };
        */
        res.json({ provider_urls: [`${baseUrl}/fedcm.json`] });
    } else {
        res.send('hello from other domains');
    }
});

/**
 * Federation metadata configuration route.
 * Serves the federation metadata configuration (fedcm.json) for the IDP.
 * @see https://fedidcg.github.io/FedCM/#idp-api-manifest
 * @route GET /fedcm.json
 */
// https://w3c-fedid.github.io/FedCM/#idp-api-config-file
/*
GET /config.json HTTP/1.1
Host: idp.example
Accept: application/json
Sec-Fetch-Dest: webidentity
*/
/*
(a) without cookies, 
(b) with the Sec-Fetch-Dest header set to webidentity, 
(c) without revealing the RP in the Origin or Referer headers, 
(d) without following HTTP redirects.
*/
metaDataRouter.get('/fedcm.json', checkSecFetchDest, (req: Request, res: Response) => {

    // Endpoints are relative and always the same
    const endpoints = {
        "accounts_endpoint": "/fedcm/accounts_endpoint",
        "client_metadata_endpoint": "/fedcm/client_metadata_endpoint",
        "id_assertion_endpoint": "/fedcm/token_endpoint",
        "revocation_endpoint": "/fedcm/revocation_endpoint",
        "login_url": "/"
    };
    //const { path, cookies } = req;
    //console.log(`${path}/cookies`, cookies);
    // Merge endpoints with branding and return result
    if (req.IDPMetadata) {
        res.json({
            ...endpoints,
            branding: req.IDPMetadata.branding
        });
    } else {
        res.status(404).send('Configuration not found - please check app.js');
    }
});