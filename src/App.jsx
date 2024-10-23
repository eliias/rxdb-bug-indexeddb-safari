import {useEffect, useRef, useState} from 'react'
import {createRxDatabase, RXDB_VERSION} from 'rxdb';
import {getRxStorageSharedWorker} from "rxdb-premium/plugins/storage-worker";
import {RxStorageIndexedDBStatics} from "rxdb-premium/plugins/storage-indexeddb";
import {faker} from '@faker-js/faker';

import './App.css'

console.info(`RxDB ${RXDB_VERSION}`);

const storage = getRxStorageSharedWorker({
    workerInput: "/indexeddb.worker.js",
    workerOptions: {
        name: "heroes",
        type: "module",
        credentials: "omit",
    },
    statics: RxStorageIndexedDBStatics,
});

const database = (async () => {
    const schema = {
        "title": "hero schema",
        "version": 0,
        "description": "describes a simple hero",
        "primaryKey": "name",
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "maxLength": 100
            }
        },
        "required": [
            "name",
        ]
    };
    const db = await createRxDatabase({
        name: "heroesdb",
        storage: storage,
        multiInstance: true,
        eventReduce: true,
        cleanupPolicy: {}
    });
    await db.addCollections({
        documents: {
            schema: schema
        }
    });
    const count = await db.collections.documents.count().exec();
    if (count === 0) {
        const documents = [];
        const collection = db.documents;
        for (let i = 1; i < 1_000; i += 1) {
            documents.push({
                name: faker.person.fullName()
            });
        }
        await collection.bulkInsert(documents);
    }

    return db;
})();

function App() {
    const [data, setData] = useState(null);
    const hasEffectRanRef = useRef(false);

    useEffect(() => {
        if (hasEffectRanRef.current) {
            return;
        }
        hasEffectRanRef.current = true;
        
        (async () => {
            const db = await database;
            const data = await db.collections.documents.find().exec();
            setData(data);
        })();
    }, []);

    function renderRecord(record) {
        return <tr key={record.name}>
            <td>{record.name}</td>
        </tr>
    }

    return (
        <>
            <h1>RxDB {RXDB_VERSION} + IndexedDB ❤️‍🩹Safari</h1>
            <table>
                <thead>
                <tr>
                    <td>Name</td>
                </tr>
                </thead>
                <tbody>
                {data && data.map(renderRecord)}
                </tbody>
            </table>

        </>
    )
}

export default App
