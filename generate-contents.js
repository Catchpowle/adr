const fs = require("fs");
const path = require("path");

function extractMetadata(markdownContent) {
  const metadata = {};
  const lines = markdownContent.split("\n");
  let isInMetadataSection = false;

  for (let line of lines) {
    // Check if line starts with ---
    if (line.trim() === "---") {
      // Toggle metadata section
      isInMetadataSection = !isInMetadataSection;
      continue;
    }

    // If it's in metadata section and contains :, extract metadata
    if (isInMetadataSection && line.includes(":")) {
      const [key, value] = line.split(":").map((item) => item.trim());
      metadata[key] = value;
    } else if (isInMetadataSection && line.trim() === "") {
      // If it's an empty line, exit metadata section
      break;
    }
  }

  return metadata;
}

function extractTitle(markdownContent) {
  const lines = markdownContent.split("\n");
  for (let line of lines) {
    if (line.trim().startsWith("# ")) {
      return line.trim().substring(2); // Remove the # symbol and trim whitespace
    }
  }
  return null;
}

function extractDate(markdownContent) {
  const lines = markdownContent.split("\n");
  for (let line of lines) {
    if (line.trim().startsWith("Date:")) {
      const date = line.trim().substring(5).trim();
      return date;
    }
  }
  return "N/A";
}

function readMarkdownFiles(directory) {
  const files = fs.readdirSync(directory);
  return files.filter((file) => file.endsWith(".md"));
}

function displayTags(tags) {
  console.log(path.join(".", "tags"));
  return tags
    .map((tag) => `[\`${tag}\`](${path.join(".", "tags", tag)})`)
    .join(" ");
}

function generateContentsPage(markdownFiles, specificTag) {
  let contents = "# Contents\n\n";
  contents += "| Date | Title | Tags | Authors |\n";
  contents += "|-------|------|------|------|\n";

  markdownFiles.reverse().forEach((filename) => {
    const markdownContent = fs.readFileSync(`doc/adr/${filename}`, "utf8");
    const metadata = extractMetadata(markdownContent);
    const tags = metadata.tags
      ? metadata.tags.split(",").map((tag) => tag.trim())
      : [];

    if (specificTag && !tags.includes(specificTag)) return;

    const date = extractDate(markdownContent);
    const title = extractTitle(markdownContent);

    const authors = metadata.authors
      ? metadata.authors.split(",").map((author) => author.trim())
      : [];
    contents += `| ${date} | [${title}](doc/adr/${filename}) | ${displayTags(
      tags
    )} | ${authors.join(", ")}\n`;
  });

  return contents;
}

function generateTagFolders(markdownFiles) {
  const tagFolders = new Set();
  markdownFiles.forEach((filename) => {
    const markdownContent = fs.readFileSync(`doc/adr/${filename}`, "utf8");
    const metadata = extractMetadata(markdownContent);
    const tags = metadata.tags
      ? metadata.tags.split(",").map((tag) => tag.trim())
      : [];
    tags.forEach((tag) => {
      tagFolders.add(tag);
    });
  });

  tagFolders.forEach((tag) => {
    const folderPath = path.join(".", "tags", tag);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const contentsPage = generateContentsPage(markdownFiles, tag);
    fs.writeFileSync(path.join(folderPath, "README.md"), contentsPage);
    console.log(`Contents page generated for tag "${tag}"`);
  });
}

// Specify the directory containing ADR Markdown files
const adrDirectory = "./doc/adr/";

// Read all ADR Markdown files in the directory
const markdownFiles = readMarkdownFiles(adrDirectory);

generateTagFolders(markdownFiles);

// Generate contents page
const contentsPage = generateContentsPage(markdownFiles);

// Write contents page to a file at the top level of the repository
fs.writeFileSync("README.md", contentsPage);
console.log("Contents page generated successfully.");
