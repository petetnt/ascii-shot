import test from "ava";
import execa from "execa";
import fetchMock from "fetch-mock";
import asciiShot from "./lib/ascii-shot";

const fixtures = require("./fixtures/fixture.json");
fetchMock.mock("https://instagram.com/petetnt/media", fixtures);

test("should throw if no username is passed", async t => {
  const { stderr } = await execa("./bin/ascii-shot", []);
  t.is(stderr, "  Error: You must pass an username");
});

test.serial("should call the semi-public api when passed an username", async t => {
  asciiShot("petetnt", { highRes: false, noColors: false }).then(() => {
    t.truthy(fetchMock.called("https://instagram.com/petetnt/media"));
  });
});
