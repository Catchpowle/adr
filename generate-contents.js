const fs = require("fs");

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

function readMarkdownFiles(directory) {
  const files = fs.readdirSync(directory);
  return files.filter((file) => file.endsWith(".md"));
}

function displayTags(tags) {
  return tags.map((tag) => `\`${tag}\``).join(" ");
}

function generateContentsPage(markdownFiles) {
  let contents = "# Contents\n\n";
  contents += "| Title | Tags |\n";
  contents += "|-------|------|\n";

  markdownFiles.reverse().forEach((filename) => {
    const markdownContent = fs.readFileSync(`doc/adr/${filename}`, "utf8");
    const metadata = extractMetadata(markdownContent);
    const title = extractTitle(markdownContent);
    const tags = metadata.tags
      ? metadata.tags.split(",").map((tag) => tag.trim())
      : [];
    contents += `| [${title}](doc/adr/${filename}) | ${displayTags(tags)} |\n`;
  });

  return contents;
}

// Specify the directory containing ADR Markdown files
const adrDirectory = "./doc/adr/";

// Read all ADR Markdown files in the directory
const markdownFiles = readMarkdownFiles(adrDirectory);

// Generate contents page
const contentsPage = generateContentsPage(markdownFiles);

// Write contents page to a file at the top level of the repository
fs.writeFileSync("README.md", contentsPage);
console.log("Contents page generated successfully.");
