import { Client } from "@notionhq/client";

interface Token {
  AccessToken: string;
  refreshToken: string;
}

type CreatePageArgs = {
  Name: string;
  AccessToken: string;
  refreshToken: string;
  date: string;
  notion: {
    apiKey: string;
    databaseId: string;
  };
};

async function storeTokenInNotion({
  Name,
  AccessToken,
  refreshToken,
  date,
  notion: { apiKey, databaseId },
}: CreatePageArgs) {
  const notion = new Client({ auth: apiKey });

  await notion.pages.create({
    parent: { database_id: `${databaseId}` },
    properties: {
      Name: { title: [{ text: { content: "Twitter Access Token" } }] },
      AccessToken: { rich_text: [{ text: { content: AccessToken } }] },
      refreshToken: { rich_text: [{ text: { content: refreshToken } }] },
    },
  });
}

export { storeTokenInNotion };
