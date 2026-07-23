import type { GetFeedResponse, GetShelfResponse, PostLikeRequest, PostLikeResponse } from "@pk-literature/contracts";
import type { Fetcher } from "./fetcher";
import { toQueryString } from "./fetcher";

export function getFeed(fetcher: Fetcher): Promise<GetFeedResponse> {
  return fetcher("/v1/feed");
}

export function getShelf(fetcher: Fetcher, shelfId: string, page = 1, pageSize = 20): Promise<GetShelfResponse> {
  return fetcher(`/v1/feed/shelf/${shelfId}${toQueryString({ page, pageSize })}`);
}

export function postLike(fetcher: Fetcher, body: PostLikeRequest): Promise<PostLikeResponse> {
  return fetcher("/v1/interest/like", { method: "POST", body: JSON.stringify(body) });
}
