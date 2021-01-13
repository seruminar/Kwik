import type { Resource } from "i18next";

export interface ISession {
  title: string;
  translations: Resource;
  qnaMaker: {
    auth: string;
    endpoint: string;
    trainEndpoint: string;
  };
}
