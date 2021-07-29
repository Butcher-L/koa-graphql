import Request from "supertest";
import Bcryptjs from "bcryptjs";
import R from "ramda";
import { expect } from "chai";
import { startServer } from "../../src/index";
import Products from "../../src/models/products";
import Users from "../../src/models/users";
import {
  generateFakeUser,
  generateFakeProduct,
  addFakeProduct,
  addFakeUserRegister,
  getToken,
} from "../helpers/helpers";
import { generateId, EntityType } from "../../src/schemas/generate-ids";

const updateProductMutation = `
            mutation($input:UpdateProductInput!){
                updateProduct(input: $input){
                    id
                    name
                    description
                }
            }
        `;

describe("Mutation.updateProduct", () => {
  after(async function () {
    await Products.deleteMany({});
  });

  it("should update product", async function () {
    const updateProductBody  = generateFakeProduct();
    const ownerId = generateId(EntityType.Account);

    await addFakeUserRegister({ownerId});
    const product = await addFakeProduct({ownerId});
    const token = await getToken({ownerId});

    const { body } = await Request(startServer)
      .post("/graphql")
      .send({
        query: updateProductMutation,
        variables: {
          input: {
            id: product.id.toString("base64"),
            body: updateProductBody ,
          },
        },
      })
      .set("Authorization", `Bearer ${token}`);

    expect(body.data.updateProduct.name).to.equal(updateProductBody.name);
  });

  it("should error if not the owner", async function () {
    const ownerId = generateId(EntityType.Account);
    await addFakeUserRegister({ownerId});
    const token = await getToken({ownerId});
    const product = await addFakeProduct({ownerId:generateId(EntityType.Account)});

    const { body } = await Request(startServer)
      .post("/graphql")
      .send({
        query: updateProductMutation,
        variables: {
          input: {
            id: product.id.toString("base64"),
            body: generateFakeProduct(),
          },
        },
      })
      .set("Authorization", `Bearer ${token}`);

    expect(body.errors[0].message).to.equal("Not the owner of the product");
  });

  it("should error if no token", async function () {
    const ownerId = generateId(EntityType.Account);
    await addFakeUserRegister({ownerId});
    const product = await addFakeProduct({ownerId:generateId(EntityType.Account)});

    const { body } = await Request(startServer)
      .post("/graphql")
      .send({
        query: updateProductMutation,
        variables: {
          input: {
            id: product.id.toString("base64"),
            body: generateFakeProduct(),
          },
        },
      });

    expect(body.errors[0].message).to.equal("Invalid authentication header.");
  });

  it("should Error if product does not exist", async function () {
    const ownerId = generateId(EntityType.Account);
    const token = await getToken({ownerId});

    const { body } = await Request(startServer)
      .post("/graphql")
      .send({
        query: updateProductMutation,
        variables: {
          input: {
            id: "123sdse1eas",
            body: generateFakeProduct(),
          },
        },
      })
      .set("Authorization", `Bearer ${token}`);
    expect(body.errors[0].message).to.equal("Product does not exist");
  });
});