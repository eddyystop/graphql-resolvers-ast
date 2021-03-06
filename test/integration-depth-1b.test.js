
const { assert } = require('chai');
const { makeExecutableSchema } = require('graphql-tools');
const { graphql } = require('graphql');

const resolversAst = require('../lib');

const { inspect } = require('util');

let log;

const typeDefs = `
  type User {
    email: String
    posts: [Post!]
  }
  
  type Post {
    body: String
    draft: Boolean
    achieved: Boolean
  }
  
  type Query {
    getUser (keyInt: Int, keyStr: String): User
    getPosts: [Post]
  }
`;

const query = `{
  getUser (keyInt: 1, keyStr: "a") {
    email
    posts {
      body
      draft
      achieved
    }
  }
}`;

const resolvers = {
  User: {
    posts (parent, args, context, ast) {
      log.UserPosts.push(resolversAst(ast));
      return [
        { body: '  post1 ', draft: true, achieved: true },
        { body: ' post2  ', draft: false, achieved: true }
      ];
    }
  },
  Query: {
    getUser (parent, args, context, ast) {
      log.QueryGetUser.push(resolversAst(ast));
      return { email: '  email1@gmail.com ' };
    },
    getPosts (parent, args, context, ast) {
      log.QueryGetPosts.push(resolversAst(ast));
      return [
        { body: '  post1 ', draft: true, achieved: true },
        { body: ' post2  ', draft: false, achieved: true }
      ];
    }
  }
};

const expectedResult = {
  data: {
    getUser: {
      email: '  email1@gmail.com ',
      posts: [
        { body: '  post1 ', draft: true, achieved: true },
        { body: ' post2  ', draft: false, achieved: true }
      ]
    }
  }
};

const expectedLog = {
  UserPosts: [{
    operation: 'Query',
    schema: [ 'User', 'posts' ],
    resolverPath: [ 'getUser', 'User', 'posts' ],
    resolveTo: '[Post!]',
    fields: [
      [
        { kind: 'Field', name: 'body', hasSelections: false },
        { kind: 'Field', name: 'draft', hasSelections: false },
        { kind: 'Field', name: 'achieved', hasSelections: false }
      ]
    ],
    args: {},
    fragments: {}
  }],
  QueryGetUser: [{
    operation: 'Query',
    schema: [ 'Query', 'getUser' ],
    resolverPath: [ 'Query', 'getUser' ],
    resolveTo: 'User',
    fields: [
      [
        { kind: 'Field', name: 'email', hasSelections: false },
        { kind: 'Field', name: 'posts', hasSelections: true }
      ]
    ],
    args: { keyInt: 1, keyStr: 'a' },
    fragments: {}
  }],
  QueryGetPosts: []
};

describe('integration-depth-1b.test.js', () => {
  beforeEach(() => {
    log = { UserPosts: [], QueryGetUser: [], QueryGetPosts: [] };
  });

  it('parses fragment', () => {
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers: resolvers
    });

    return graphql(schema, query, {}, {})
      .then(result => {
        assert.deepEqual(result, expectedResult, 'bad result');
        assert.deepEqual(log, expectedLog, 'bad log');
      })
      .catch(err => assert(false, err.message));
  });
});

function inspector (obj, depth) { // eslint-disable-line
  console.log(inspect(obj, { depth, colors: true }));
}
