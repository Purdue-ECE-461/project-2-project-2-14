//building upon mock firestore jest examples

const { FakeFirestore } = require('firestore-jest-mock');
const { mockCollection, mockDoc } = require('firestore-jest-mock/mocks/firestore');

describe('Queries', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const db = (simulateQueryFilters = false) =>
    new FakeFirestore(
      {
        characters: [
          {
            id: 'isAdmin',
            username: 'Homer',
            token: 'token1234',
            // May 12, 1956.  Conveniently, a negative number
            time: {
              seconds: -430444800,
              nanoseconds: 0,
            },
            // Test a pre-constructed Timestamp
            timestamp: new FakeFirestore.Timestamp(123, 456),
          },
          { id: 'tali1', username: 'tali', token: '45' },
          {
            id: 'gao40',
            username: 'gao440',
            token: 'token12',
            _collections: {
              embedded: [
                { id: 'violet', username: 'Violet1' },
                { id: 'dash', username: 'Dash1', tokenVal: '12' },
                { id: 'jack', username: 'Jack1', tokenVal: '12' },
                { id: 'helen', username: 'Helen1', tokenVal: '34' },
              ],
            },
          },
        ],
      },
      { simulateQueryFilters },
    );

  describe('Single records versus queries', () => {
    test('it can fetch a single record', async () => {
      expect.assertions(6);
      const record = await db()
        .collection('characters')
        .doc('tali1')
        .get();
      expect(mockCollection).toHaveBeenCalledWith('characters');
      expect(mockDoc).toHaveBeenCalledWith('tali1');
      expect(record.exists).toBe(true);
      expect(record.id).toBe('tali1');
      const data = record.data();
      expect(data).toHaveProperty('username', 'tali');
      expect(data).toHaveProperty('token', '45');
    });

    test('it flags records do not exist', async () => {
      expect.assertions(4);
      const record = await db()
        .collection('animals')
        .doc('monkey')
        .get();
      expect(mockCollection).toHaveBeenCalledWith('animals');
      expect(mockDoc).toHaveBeenCalledWith('monkey');
      expect(record.id).toBe('monkey');
      expect(record.exists).toBe(false);
    });

    test('it can fetch a single record with a promise', () =>
      db()
        .collection('characters')
        .doc('isAdmin')
        .get()
        .then(record => {
          expect(record.exists).toBe(true);
          expect(record.id).toBe('isAdmin');
          expect(mockCollection).toHaveBeenCalledWith('characters');
          const data = record.data();
          expect(record).toHaveProperty('exists', true);
          expect(data).toBeDefined();
          expect(data).toHaveProperty('username', 'Homer');
          expect(data).toHaveProperty('token', 'token1234');

          expect(record.get('username')).toEqual('Homer');
        }));

    test('it can fetch a single record with a promise without a specified collection', () =>
      db()
        .doc('characters/isAdmin')
        .get()
        .then(record => {
          expect(record.exists).toBe(true);
          expect(record.id).toBe('isAdmin');
          expect(mockCollection).not.toHaveBeenCalled();
          const data = record.data();
          expect(record).toHaveProperty('exists', true);
          expect(data).toBeDefined();
          expect(data).toHaveProperty('username', 'Homer');
          expect(data).toHaveProperty('token', 'token1234');
        }));

    test('it can fetch multiple records and returns documents', async () => {
      const records = await db()
        .collection('characters')
        .where('username', '==', 'Homer')
        .get();

      expect(records.empty).toBe(false);
      expect(records).toHaveProperty('docs', expect.any(Array));
      const doc = records.docs[0];
      expect(doc).toHaveProperty('id', 'isAdmin');
      expect(doc).toHaveProperty('exists', true);
      const data = doc.data();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('username', 'Homer');
    });

    test('it throws an error if the collection path ends at a document', () => {
      expect(() => db().collection('')).toThrow(Error);
      expect(db().collection('foo')).toBeInstanceOf(FakeFirestore.CollectionReference);
      expect(() => db().collection('foo/bar')).toThrow(Error);
      expect(db().collection('foo/bar/baz')).toBeInstanceOf(FakeFirestore.CollectionReference);
    });

    test('it throws an error if the document path ends at a collection', () => {
      expect(() => db().doc('')).toThrow(Error);
      expect(() => db().doc('characters')).toThrow(Error);
      expect(db().doc('characters/gao40')).toBeInstanceOf(FakeFirestore.DocumentReference);
      expect(() => db().doc('characters/gao40/embedded')).toThrow(Error);
    });

    test('it can fetch nonexistent documents from a root collection', async () => {
      const nope = await db()
        .doc('characters/joe')
        .get();
      expect(nope).toHaveProperty('exists', false);
      expect(nope).toHaveProperty('id', 'joe');
      expect(nope).toHaveProperty('ref');
      expect(nope.ref).toHaveProperty('path', 'characters/joe');
    });

    test('it can fetch nonexistent documents from extant subcollections', async () => {
      const nope = await db()
        .doc('characters/gao40/embedded/thing3')
        .get();
      expect(nope).toHaveProperty('exists', false);
      expect(nope).toHaveProperty('id', 'thing3');
      expect(nope).toHaveProperty('ref');
      expect(nope.ref).toHaveProperty('path', 'characters/gao40/embedded/thing3');
    });

    test('it can fetch nonexistent documents from nonexistent subcollections', async () => {
      const nope = await db()
        .doc('characters/sam/embedded/phil')
        .get();
      expect(nope).toHaveProperty('exists', false);
      expect(nope).toHaveProperty('id', 'phil');
      expect(nope).toHaveProperty('ref');
      expect(nope.ref).toHaveProperty('path', 'characters/sam/embedded/phil');
    });

    test('it can fetch nonexistent documents from nonexistent root collections', async () => {
      const nope = await db()
        .doc('foo/bar/baz/bin')
        .get();
      expect(nope).toHaveProperty('exists', false);
      expect(nope).toHaveProperty('id', 'bin');
      expect(nope).toHaveProperty('ref');
      expect(nope.ref).toHaveProperty('path', 'foo/bar/baz/bin');
    });

    test('it flags when a collection is empty', async () => {
      expect.assertions(1);
      const records = await db()
        .collection('animals')
        .where('type', '==', 'mammal')
        .get();
      expect(records).toHaveProperty('empty', true);
    });

    test.each`
      simulateQueryFilters | expectedSize
      ${true}              | ${1}
      ${false}             | ${3}
    `('it can fetch multiple records as a promise', ({ simulateQueryFilters, expectedSize }) =>
      db(simulateQueryFilters)
        .collection('characters')
        .where('username', '==', 'Homer')
        .get()
        .then(records => {
          expect(records).toHaveProperty('empty', false);
          expect(records).toHaveProperty('docs', expect.any(Array));
          expect(records).toHaveProperty('size', expectedSize);
          expect(records.docs[0]).toHaveProperty('id', 'isAdmin');
          expect(records.docs[0]).toHaveProperty('exists', true);
          expect(records.docs[0].data()).toHaveProperty('username', 'Homer');
        }),
    );

    test('it can return all root records', async () => {
      expect.assertions(4);
      const firstRecord = db()
        .collection('characters')
        .doc('isAdmin');
      const secondRecord = db()
        .collection('characters')
        .doc('tali1');

      const records = await db().getAll(firstRecord, secondRecord);
      expect(records.length).toBe(2);
      expect(records[0]).toHaveProperty('id', 'isAdmin');
      expect(records[0]).toHaveProperty('exists', true);
      expect(records[0].data()).toHaveProperty('username', 'Homer');
    });

    test('it does not fetch subcollections unless we tell it to', async () => {
      expect.assertions(4);
      const record = await db()
        .collection('characters')
        .doc('gao40')
        .get();
      expect(record.exists).toBe(true);
      expect(record.id).toBe('gao40');
      expect(record.data()).toHaveProperty('username', 'gao440');
      expect(record.data()).not.toHaveProperty('_collections');
    });

    test('it can fetch records from subcollections', async () => {
      expect.assertions(8);
      const embedded = db()
        .collection('characters')
        .doc('gao40')
        .collection('embedded');
      expect(embedded.path).toBe('characters/gao40/embedded');

      const allFamilyMembers = await embedded.get();
      expect(allFamilyMembers.docs.length).toBe(4);
      expect(allFamilyMembers.forEach).toBeTruthy();

      const ref = embedded.doc('violet');
      expect(ref).toHaveProperty('path', 'characters/gao40/embedded/violet');

      const record = await ref.get();
      expect(record).toHaveProperty('exists', true);
      expect(record).toHaveProperty('id', 'violet');
      expect(record).toHaveProperty('data');
      expect(record.data()).toHaveProperty('username', 'Violet1');
    });

    test.each`
      simulateQueryFilters | expectedSize
      ${true}              | ${2}
      ${false}             | ${4}
    `(
      'it can fetch records from subcollections with query parameters',
      async ({ simulateQueryFilters, expectedSize }) => {
        const embedded = db(simulateQueryFilters)
          .collection('characters')
          .doc('gao40')
          .collection('embedded')
          .where('tokenVal', '==', '12'); // should return only 12s
        expect(embedded).toHaveProperty('path', 'characters/gao40/embedded');

        const docs = await embedded.get();
        expect(docs).toHaveProperty('size', expectedSize);
      },
    );
  });

  describe('Multiple records versus queries', () => {
    test('it fetches all records from a root collection', async () => {
      expect.assertions(4);
      const characters = await db()
        .collection('characters')
        .get();
      expect(characters).toHaveProperty('empty', false);
      expect(characters).toHaveProperty('size', 3);
      expect(Array.isArray(characters.docs)).toBe(true);
      expect(characters.forEach).toBeTruthy();
    });

    test('it fetches no records from nonexistent collection', async () => {
      expect.assertions(4);
      const nope = await db()
        .collection('foo')
        .get();
      expect(nope).toHaveProperty('empty', true);
      expect(nope).toHaveProperty('size', 0);
      expect(Array.isArray(nope.docs)).toBe(true);
      expect(nope.forEach).toBeTruthy();
    });

    test('it fetches all records from subcollection', async () => {
      expect.assertions(4);
      const embeddedRef = db()
        .collection('characters')
        .doc('gao40')
        .collection('embedded');
      const embedded = await embeddedRef.get();
      expect(embedded).toHaveProperty('empty', false);
      expect(embedded).toHaveProperty('size', 4);
      expect(Array.isArray(embedded.docs)).toBe(true);
      expect(embedded.forEach).toBeTruthy();
    });

    test('it fetches no records from nonexistent subcollection', async () => {
      expect.assertions(4);
      const nope = await db()
        .collection('characters')
        .doc('gao40')
        .collection('not-here')
        .get();
      expect(nope).toHaveProperty('empty', true);
      expect(nope).toHaveProperty('size', 0);
      expect(Array.isArray(nope.docs)).toBe(true);
      expect(nope.forEach).toBeTruthy();
    });

    test('it fetches no records from nonexistent root collection', async () => {
      expect.assertions(4);
      const nope = await db()
        .collection('foo')
        .doc('bar')
        .collection('baz')
        .get();
      expect(nope).toHaveProperty('empty', true);
      expect(nope).toHaveProperty('size', 0);
      expect(Array.isArray(nope.docs)).toBe(true);
      expect(nope.forEach).toBeTruthy();
    });
  });

  test('New documents with random ID', async () => {
    expect.assertions(2);
    // See https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference#doc
    // "If no path is specified, an automatically-generated unique ID will be used for the returned DocumentReference."
    const col = db().collection('foo');
    const newDoc = col.doc();
    const otherIds = col._records().map(doc => doc.id);
    expect(otherIds).not.toContainEqual(newDoc.id);
    expect(newDoc).toHaveProperty('path', `foo/${newDoc.id}`);
  });

  test('it properly converts timestamps', () =>
    db()
      .doc('characters/isAdmin')
      .get()
      .then(record => {
        expect(record.id).toEqual('isAdmin');
        const data = record.data();
        expect(typeof data.time.toDate).toEqual('function');
      }));
});