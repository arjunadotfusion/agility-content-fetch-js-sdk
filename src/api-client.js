import axios from 'axios'
import { setupCache } from 'axios-cache-adapter'
import getSitemapFlat from './methods/getSitemapFlat'
import getSitemapNested from './methods/getSitemapNested'
import getContentItem from './methods/getContentItem'
import getContentList from './methods/getContentList'
import getPage from './methods/getPage'
import getGallery from './methods/getGallery'
import FilterOperators from './types/FilterOperator'
import FilterLogicOperators from './types/FilterLogicOperator'
import SortDirections from './types/SortDirection'
import { logError, logDebug } from './utils'

const defaultConfig = {
    baseUrl: null,
    isPreview: false,
    guid: null,
    apiKey: null,
    languageCode: null,
    headers: {},
    requiresGuidInHeaders: false,
    debug: false,
    caching: {
        maxAge: 0 //caching disabled by default
    }
};

export default function createClient(userConfig) {
    

    //merge our config - user values will override our defaults
    let config = {
        ...defaultConfig,
        ...userConfig
    };

    //compute the base Url
    if(!config.baseUrl) {
        //use default url
        config.baseUrl = `https://${config.guid}-api.agilitycms.cloud`;
    } else {
        //we are using a custom url, make sure we include the guid in the headers
        config.requiresGuidInHeaders = true;
    }

    let adapter = null;
    
    //should we turn on caching?
    if(config.caching.maxAge > 0) {
        const cache = setupCache({
            maxAge: config.caching.maxAge,
            exclude: { query: false }
        });
        adapter = cache.adapter;
    }

    //create apply the adapter to our axios instance
    const api = axios.create({
        adapter: adapter
    })

    //the function that actually makes ALL our requests
    function makeRequest(reqConfig) {
        
        if(config.debug) {
            logDebug(`AgilityCMS Fetch API LOG: ${reqConfig.baseURL}${reqConfig.url}`);
        } 

        //make the request using our axios instance       
        return api(reqConfig).then(async (response) => {
            
            let data = response.data;
            //if our response is from cache, inject that property in the data response
            if(response.request.fromCache) {
                data['fromCache'] = true;
            }
            return data;
        })
        .catch(async (error) => {
            logError(`AgilityCMS Fetch API ERROR: Request failed for ${reqConfig.baseURL}${reqConfig.url} ... ${error} ... Does the item exist?`)
        });
    }

    //export only these properties:
    return {
        config: config,
        makeRequest: makeRequest,
        getSitemapFlat: getSitemapFlat,
        getSitemapNested: getSitemapNested,
        getContentItem: getContentItem,
        getContentList: getContentList,
        getPage: getPage,
        getGallery: getGallery,
        types: {
            FilterOperators: FilterOperators,
            FilterLogicOperators: FilterLogicOperators,
            SortDirections: SortDirections
        }
    }

}