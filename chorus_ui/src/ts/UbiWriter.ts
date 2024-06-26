/**
 * Work in progress!
 * 
 * This file illustrates how one might use the UbiClient to integrate with 
 * Search-collector: https://github.com/searchhub/search-collector
 */


import {Writer} from "search-collector";
//import {} from '../search_collector.window.bundle'
import {UbiClient} from "./UbiClient";
import { UbiEvent } from "./UbiEvent";

/*
const {
	CollectorModule,
	Context,
	cookieSessionResolver,
	debounce,
	DefaultWriter,
	FiredSearchCollector,
	InstantSearchQueryCollector,
	positionResolver,
	Query,
	Sentinel,
	Trail,
	TrailType,
	DebugWriter,
	QueryWriter,
	TrailWriter,
	JSONEnvelopeWriter,
	RedirectCollector,
	BrowserTrackingWriter,
	ProductClickCollector,
	ImpressionCollector,
	SearchResultCollector,
	BasketClickCollector,
	CheckoutClickCollector,
	ConsoleTransport,
	SuggestSearchCollector,
	AssociatedProductCollector,
	ListenerType,
} = window.SearchCollector;
*/

/**
 * This connects the UbiClient to the search-collector's DemoWriter code
 */
export class UbiWriter implements Writer {
	private readonly ubi_client:UbiClient;

	constructor(olUrl, channel, queryResolver, sessionResolver, debug) {


		//this.ubi_client = new UbiClient(olUrl, channel);

		const localstorageWriter = {
			write: (data) => {
				const dataArr = JSON.parse(localStorage.getItem("____localstorageWriter") || "[]");
				dataArr.push(data);
				localStorage.setItem("____localstorageWriter", JSON.stringify(dataArr));
			}
		}
		/*
		const SearchCollector = window.SearchCollector;
		let writer = new SearchCollector.DebugWriter(localstorageWriter, debug);
		writer = new SearchCollector.QueryWriter(writer, queryResolver);
		writer = new SearchCollector.TrailWriter(writer, new SearchCollector.Trail(queryResolver, sessionResolver), queryResolver);
		writer = new SearchCollector.JSONEnvelopeWriter(writer, sessionResolver, channel);
		writer = new SearchCollector.BrowserTrackingWriter(writer, {
			recordReferrer: true,
			recordUrl: true,
			recordLanguage: true
		});

		this.writer = writer;
		*/
	}

	write(data) {
		//TODO: chicken/egg?

		//this.ubi_client.info(data);
		//this.writer.write(data);
		console.warn('EVENT WRITE => ' + JSON.stringify(data));
	}

	write_event(e:UbiEvent){
		//console.log('about to log');
		//this.ubi_client.log_event(e);
		console.log('Just logged: ' + e.toJson());
	}
}
