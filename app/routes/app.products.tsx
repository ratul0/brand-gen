import { useEffect, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";

import { authenticate } from "../shopify.server";

const PAGE_SIZE = 9;

type ProductSummary = {
  id: string;
  title: string;
  status: string;
  featuredMedia?: {
    preview?: {
      image?: {
        url: string;
        altText?: string | null;
      } | null;
    } | null;
    image?: {
      url: string;
      altText?: string | null;
    } | null;
  } | null;
};

type ProductEdge = {
  cursor: string;
  node: ProductSummary;
};

type ProductConnection = {
  edges: ProductEdge[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: string | null;
  };
};

type ProductsQuery = {
  data?: {
    products?: ProductConnection;
  };
  errors?: Array<{ message: string }>;
};

type LoaderData = {
  products: ProductConnection;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const after = url.searchParams.get("after") || undefined;

  const variables: { first: number; after?: string } = {
    first: PAGE_SIZE,
  };

  if (after) {
    variables.after = after;
  }

  const response = await admin.graphql(
    `#graphql
      query ActiveProducts($first: Int!, $after: String) {
        products(first: $first, after: $after, query: "status:active") {
          edges {
            cursor
            node {
              id
              title
              status
              featuredMedia {
                preview {
                  image {
                    altText
                    url
                  }
                }
                ... on MediaImage {
                  image {
                    altText
                    url
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    { variables },
  );

  const payload = (await response.json()) as ProductsQuery;

  if (payload.errors?.length) {
    throw new Response(
      payload.errors[0]?.message ?? "Failed to load products",
      { status: 500 },
    );
  }

  const products = payload.data?.products;

  if (!products) {
    throw new Response("No data returned from Shopify", { status: 502 });
  }

  return {
    products,
  } satisfies LoaderData;
};

export default function ProductsPage() {
  const { products } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<LoaderData>();
  const [edges, setEdges] = useState(products.edges);
  const [pageInfo, setPageInfo] = useState(products.pageInfo);
  const lastAppendedCursor = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEdges(products.edges);
    setPageInfo(products.pageInfo);
    lastAppendedCursor.current = products.pageInfo.endCursor ?? null;
  }, [products]);

  useEffect(() => {
    const incoming = fetcher.data?.products;
    if (!incoming) return;

    const nextCursor = incoming.pageInfo.endCursor ?? null;
    if (lastAppendedCursor.current === nextCursor) return;

    setEdges((current) => [...current, ...incoming.edges]);
    setPageInfo(incoming.pageInfo);
    lastAppendedCursor.current = nextCursor;
  }, [fetcher.data]);

  useEffect(() => {
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          fetcher.state === "idle" &&
          pageInfo.hasNextPage &&
          pageInfo.endCursor
        ) {
          fetcher.load(
            `?after=${encodeURIComponent(pageInfo.endCursor)}`,
          );
        }
      },
      { rootMargin: "200px" },
    );

    const element = sentinelRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [fetcher, pageInfo.hasNextPage, pageInfo.endCursor]);

  return (
    <s-page heading="Products">
      <s-section heading="Active products">
        {edges.length === 0 ? (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-text>This store doesn&apos;t have any active products yet.</s-text>
          </s-box>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {edges.map(({ node: product }) => {
              const mediaImage =
                product.featuredMedia?.image ??
                product.featuredMedia?.preview?.image;

              return (
                <s-box
                  key={product.id}
                  borderWidth="base"
                  borderRadius="base"
                  padding="base"
                  background="subdued"
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div
                      style={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "var(--s-color-bg-subdued, #f6f6f7)",
                        aspectRatio: "4 / 3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {mediaImage?.url ? (
                        <img
                          src={mediaImage.url}
                          alt={mediaImage.altText ?? product.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <s-text>No image</s-text>
                      )}
                    </div>
                    <s-text>{product.status.toLowerCase()}</s-text>
                    <s-text>
                      <strong>{product.title}</strong>
                    </s-text>
                  </div>
                </s-box>
              );
            })}
          </div>
        )}
        <div ref={sentinelRef} />
        {fetcher.state !== "idle" && (
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <s-text>Loading more products…</s-text>
          </div>
        )}
      </s-section>
    </s-page>
  );
}
