import axios from "axios";

const GITLAB_URL = process.env.GITLAB_URL;
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

if (!GITLAB_URL) throw new Error("Missing GITLAB_URL in environment variables");
if (!GITLAB_TOKEN) throw new Error("Missing GITLAB_TOKEN in environment variables");

export async function getMrDiff(projectId: string, mrIid: string) {
  const encodedId = encodeURIComponent(projectId);

  const response = await axios.get(
    `${GITLAB_URL}/api/v4/projects/${encodedId}/merge_requests/${mrIid}/changes`,
    { headers: { "PRIVATE-TOKEN": GITLAB_TOKEN } }
  );

  return {
    title: response.data.title,
    diff_refs: response.data.diff_refs,
    changes: response.data.changes.map((change: any) => ({
      path: change.new_path,
      diff: change.diff,
      new_path: change.new_path,
      old_path: change.old_path,
    }))
  };
}

export async function postMrDiscussion(
  projectId: string,
  mrIid: string,
  body: string,
  path: string,
  newLine: number,
  diffRefs: any
) {
  const encodedId = encodeURIComponent(projectId);

  const payload = {
    body,
    position: {
      base_sha: diffRefs.base_sha,
      start_sha: diffRefs.start_sha,
      head_sha: diffRefs.head_sha,
      position_type: "text",
      new_path: path,
      new_line: newLine,
    },
  };

  await axios.post(
    `${GITLAB_URL}/api/v4/projects/${encodedId}/merge_requests/${mrIid}/discussions`,
    payload,
    { headers: { "PRIVATE-TOKEN": GITLAB_TOKEN } }
  );
}
