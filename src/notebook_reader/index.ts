// Read all files in observabel-nodebooks folder
import { readdirSync, readFileSync, unlinkSync } from "fs";
import { Runtime, Library } from "@observablehq/runtime";
import { default as duckdb } from "duckdb";
import { locate } from "func-loc";
type NotebookMetadata = {
  author: string;
  slug: string;
  nodebook_id: string;
};

type NotebookReference = {
  nodebook_id: string;
  name: string;
};
type NotebookVariable = {
  nodebook_id: string;
  name: string;
  inputs: NotebookReference[];
  src: string;
};

console.log(import.meta.url);

const decodeVariable = async (
  notebook: NotebookMetadata,
  variable
): Promise<NotebookVariable> => {
  const location = await locate(variable._definition);
  const nodebook_id = location.source.split("/").at(-1);
  return {
    nodebook_id: nodebook_id,
    name: variable._name,
    inputs: await Promise.all(
      variable._inputs.map(async (v) => ({
        nodebook_id: (await locate(v._definition)).source.split("/").at(-1),
        name: v._name,
      }))
    ),
    src: variable._definition.toString(),
  };
};

async function main(): Promise<NotebookVariable[]> {
  const work: Promise<any>[] = [];
  const vars: Promise<NotebookVariable>[] = [];
  readdirSync("./observable-notebooks/@tomlarkworthy").forEach((dir) => {
    console.log(`dir ${dir}`);
    //if (dir !== "lazer-cutting-notebook") return;
    /*
    readdirSync(`./observable-notebooks/@tomlarkworthy/${dir}`).forEach(
        (file) => {
        console.log(`file ${file}`);
        if (file.endsWith(".js")) {
            const filename = `./observable-notebooks/@tomlarkworthy/${dir}/${file}`;
            const content = readFileSync(filename, "utf-8");
            const firsLine = content.split("\n")[0];
            const frontMatter = parseFrontMatter(firsLine);
        }
        }
    );*/
    const indexFile = `./observable-notebooks/@tomlarkworthy/${dir}/index.js`;
    const index = readFileSync(indexFile, "utf-8");
    // look for the content file in string like './8ceea2cb7d7a8a20@542.js'
    const contentFileSegment = index.match(/"\.\/(.+\.js)"/)[1];
    const contentFile = `./observable-notebooks/@tomlarkworthy/${dir}/${contentFileSegment}`;
    const content = readFileSync(contentFile, "utf-8");

    // setup
    const notebook: NotebookMetadata = {
      author: "@tomlarkworthy",
      slug: dir,
      nodebook_id: contentFileSegment,
    };

    // parse content
    const runtime = new Runtime();
    const task = import("../../" + indexFile)
      .then((module) => {
        console.log(`loaded ${contentFile}`);
        const main = runtime.module(module.default);
        const variables: Set<any> = runtime._variables;
        return variables.forEach((v) => {
          if (v._module === main) {
            vars.push(decodeVariable(notebook, v));
          }
        });
      })
      .catch((e) => {
        console.error(`Error loading ${contentFile}`);
        console.error(e);
      });
    work.push(task);
  });
  await Promise.all(work);
  return await Promise.all(vars);
}

const vars = await main();
// delete db
unlinkSync("src/data/notebooks.duckdb");
const db = new duckdb.Database("src/data/notebooks.duckdb");
const con = db.connect();
await con.run("CREATE TABLE variable (nodebook_id TEXT, name TEXT, src TEXT)");
await con.run(
  "CREATE TABLE deps (input_nodebook_id TEXT, output_nodebook_id TEXT, input_name TEXT, output_name TEXT)"
);

vars.map((v) => {
  con.run(
    `INSERT INTO variable (nodebook_id, name, src) VALUES ('${v.nodebook_id}', '${v.name}', '${v.src}')`
  );
  v.inputs.map((i) => {
    con.run(
      `INSERT INTO deps (input_nodebook_id, output_nodebook_id, input_name, output_name) VALUES ('${i.nodebook_id}', '${v.nodebook_id}', '${i.name}', '${v.name}')`
    );
  });
});
con.run("COPY deps TO 'src/data/deps.parquet' (FORMAT PARQUET);");
con.run("COPY variable TO 'src/data/variable.parquet' (FORMAT PARQUET);");
