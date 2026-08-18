package org.opensearch.search.pipeline.inner;

import org.opensearch.action.search.SearchRequest;
import org.opensearch.action.search.SearchResponse;
import org.opensearch.action.search.SearchResponseSections;
import org.opensearch.ingest.ConfigurationUtils;
import org.opensearch.search.SearchHit;
import org.opensearch.search.SearchHits;
import org.opensearch.search.pipeline.AbstractProcessor;
import org.opensearch.search.pipeline.Processor;
import org.opensearch.search.pipeline.SearchResponseProcessor;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

/**
 * A search response processor that reads the {@code hits.hits[0].inner_hits.{inner_hits_documents_field}.hits.hits}
 * array off of the first hit search response and replaces the returned {@link SearchHits} with the nested documents
 * hits, as if OpenSearch had matched these documents instead.
 */
public class InnerHitsToDocsFormatter extends AbstractProcessor implements SearchResponseProcessor {

    public static final String TYPE = "inner_hits_to_docs";

    static final String inner_hits_documents_field = "inner_hits_documents_field";
    static final String document_id_field = "document_id_field";
    // Used for the sample data with "id" as ID field
    static final String DEFAULT_DOCUMENT_ID_FIELD = "id";

    private final String innerHitsDocumentsField;
    private final String documentIdField;

    InnerHitsToDocsFormatter(String tag, String description, boolean ignoreFailure,
                             String innerHitsDocumentsField, String documentIdField) {
        super(tag, description, ignoreFailure);
        this.innerHitsDocumentsField = innerHitsDocumentsField;
        this.documentIdField = documentIdField;
    }

    @Override
    public String getType() {
        return TYPE;
    }

    @Override
    public SearchResponse processResponse(SearchRequest request, SearchResponse response) throws IOException {
        SearchHit[] hits = response.getHits().getHits();
        if (hits.length == 0) {
            return response;
        }

        Map<String, SearchHits> innerHitsMap = hits[0].getInnerHits();
        if (innerHitsMap == null) {
            return response;
        }

        SearchHits searchHits = innerHitsMap.get(innerHitsDocumentsField);
        if (searchHits == null) {
            return response;
        }

        SearchHit[] rewritten = new SearchHit[searchHits.getHits().length];
        for (int i = 0; i < searchHits.getHits().length; i++) {
            rewritten[i] = withResolvedId(searchHits.getHits()[i]);
        }
        SearchHits newSearchHits = new SearchHits(rewritten, searchHits.getTotalHits(), searchHits.getMaxScore());

        SearchResponseSections original = response.getInternalResponse();
        SearchResponseSections newSections = new SearchResponseSections(
                newSearchHits,
                original.aggregations(),
                original.suggest(),
                original.timedOut(),
                original.terminatedEarly(),
                null, // profile results are not exposed via a public getter; dropped on expansion
                original.getNumReducePhases(),
                original.getSearchExtBuilders()
        );

        return new SearchResponse(
                newSections,
                response.getScrollId(),
                response.getTotalShards(),
                response.getSuccessfulShards(),
                response.getSkippedShards(),
                response.getTook().millis(),
                response.getShardFailures(),
                response.getClusters(),
                response.pointInTimeId()
        );
    }

    /**
     * Nested inner hits inherit the parent's _id (nested docs have no _id of their own).
     * This rebuilds the hit with the nested object's own business id promoted to _id,
     * so downstream consumers (like Search Relevance Workbench) can distinguish hits.
     */
    private SearchHit withResolvedId(SearchHit hit) {
        Map<String, Object> source = hit.getSourceAsMap();
        Object rawId = source != null ? source.get(documentIdField) : null;
        if (rawId == null) {
            // No usable id field found; leave the hit as-is (still carries parent's _id).
            return hit;
        }

        SearchHit copy = new SearchHit(
                hit.docId(),
                String.valueOf(rawId),
                hit.getNestedIdentity(),
                Collections.emptyMap(),
                Collections.emptyMap()
        );
        copy.sourceRef(hit.getSourceRef());
        copy.score(hit.getScore());
        if (hit.getExplanation() != null) {
            copy.explanation(hit.getExplanation());
        }
        if (hit.getMatchedQueries() != null) {
            copy.matchedQueries(hit.getMatchedQueries());
        }
        if (hit.getHighlightFields() != null) {
            copy.highlightFields(hit.getHighlightFields());
        }
        copy.shard(hit.getShard());
        return copy;
    }

    static class Factory implements Processor.Factory<SearchResponseProcessor> {
        @Override
        public InnerHitsToDocsFormatter create(
                Map<String, Processor.Factory<SearchResponseProcessor>> processorFactories,
                String tag,
                String description,
                boolean ignoreFailure,
                Map<String, Object> config,
                PipelineContext pipelineContext
        ) {
            String innerHitsDocumentsField = ConfigurationUtils.readStringProperty(
                    TYPE, tag, config, inner_hits_documents_field);
            String documentIdField = ConfigurationUtils.readStringProperty(
                    TYPE, tag, config, document_id_field, DEFAULT_DOCUMENT_ID_FIELD);
            return new InnerHitsToDocsFormatter(tag, description, ignoreFailure, innerHitsDocumentsField, documentIdField);
        }
    }
}
