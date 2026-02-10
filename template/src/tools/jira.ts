import axios from 'axios';

const JIRA_HOST = process.env.JIRA_HOST;
const JIRA_TOKEN = process.env.JIRA_TOKEN;

export async function getJiraTicket(issueKey: string): Promise<string> {
  if (!JIRA_HOST || !JIRA_TOKEN) {
    return "Jira credentials are not fully configured in .env. Skipping ticket check.";
  }

  try {
    const url = `${JIRA_HOST}/rest/api/2/issue/${issueKey}?fields=summary,description,status`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${JIRA_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    const fields = response.data.fields;
    const descriptionText = typeof fields.description === 'string'
      ? fields.description
      : JSON.stringify(fields.description);

    return `
=== JIRA TICKET: ${issueKey} ===
STATUS: ${fields.status.name}
SUMMARY: ${fields.summary}
DESCRIPTION: ${descriptionText}
================================
`;

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) return `Jira ticket ${issueKey} not found.`;
      if (error.response?.status === 401) {
        return `Jira authentication failed. Your server likely requires a Personal Access Token (Bearer).`;
      }
    }
    return `Failed to fetch Jira ticket: ${error.message}`;
  }
}
