const fs = require("fs");
const path = require("path");

const REPO_URL =
  "https://github.com/pleo-io/architectural-decision-records/blob/main";

function extractMetadata(markdownContent) {
  const metadata = {};
  const lines = markdownContent.split("\n");
  let isInMetadataSection = false;

  for (let line of lines) {
    if (line.trim() === "---") {
      isInMetadataSection = !isInMetadataSection;
    } else if (isInMetadataSection && line.includes(":")) {
      const [key, value] = line.split(":").map((item) => item.trim());
      metadata[key] = value;
    } else if (isInMetadataSection && line.trim() === "") {
      break;
    }
  }

  return metadata;
}

function extractTitle(markdownContent) {
  const line = markdownContent
    .split("\n")
    .find((line) => line.trim().startsWith("# "));
  return line ? line.trim().substring(2) : null;
}

function extractDate(markdownContent) {
  const line = markdownContent
    .split("\n")
    .find((line) => line.trim().startsWith("Date:"));
  return line ? line.trim().substring(5).trim() : "N/A";
}

function displayTitle(title, filename) {
  return `[${title}](${REPO_URL}/doc/adr/${filename})`;
}

function displayTags(tags) {
  return tags
    .map((tag) => `[\`${tag}\`](${REPO_URL}/tags/${tag}.md)`)
    .join(" ");
}

function displayAuthors(authors) {
  return `${authors.join(", ")}`;
}

function extractADRData(markdownFiles) {
  const allTags = new Set();
  const fileData = markdownFiles.map((filename) => {
    const markdownContent = fs.readFileSync(`doc/adr/${filename}`, "utf8");
    const metadata = extractMetadata(markdownContent);
    const tags = (metadata.tags || "").split(",").map((tag) => tag.trim());
    tags.forEach((tag) => allTags.add(tag));
    const date = extractDate(markdownContent);
    const title = extractTitle(markdownContent);
    const authors = (metadata.authors || "")
      .split(",")
      .map((author) => author.trim());

    return {
      filename,
      date,
      title,
      tags,
      authors,
    };
  });

  return {
    allTags,
    fileData,
  };
}

function getContentsTable(adrData, filterTag) {
  const tableHeadings = "| Date | Title | Tags | Authors |";
  const tableDivders = "| ------- | ------- | ------- | ------- |";
  const tableData = adrData.fileData
    .filter((data) => (filterTag ? data.tags.includes(filterTag) : true))
    .map(
      (data) =>
        `| ${data.date} | ${displayTitle(
          data.title,
          data.filename
        )} | ${displayTags(data.tags)} | ${displayAuthors(data.authors)} |`
    )
    .toReversed()
    .join("\n");

  const tagFilterList = displayTags([...adrData.allTags]);

  return `## Contents\n\nFilter: ${tagFilterList}\n\n${tableHeadings}\n${tableDivders}\n${tableData}`;
}

function getContributionSection() {
  const heading = "## Contributing";
  const body =
    "Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to add an ADR.";

  return `${heading}\n\n${body}`;
}

function createREADME(adrData) {
  const heading = "# Architectural Decision Records (ADRs)";
  const contribtuionSection = getContributionSection();
  const contentsTable = getContentsTable(adrData);
  const contents = `${heading}\n\n${contribtuionSection}\n\n${contentsTable}`;

  fs.writeFileSync("README.md", contents);

  console.log("README generated successfully.");
}

function createFilteredContentPages(adrData) {
  adrData.allTags.forEach((tag) => {
    const folderPath = path.join(".", "tags");

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const heading = `# Architectural Decision Records (ADRs) - ${tag}`;
    const content = `${heading}\n\n${getContentsTable(adrData, tag)}`;

    fs.writeFileSync(path.join(folderPath, `${tag}.md`), content);

    console.log(`Contents page generated for tag "${tag}"`);
  });
}

const markdownFiles = fs
  .readdirSync("./doc/adr/")
  .filter((file) => file.endsWith(".md"));

const adrData = extractADRData(markdownFiles);

createREADME(adrData);
createFilteredContentPages(adrData);
