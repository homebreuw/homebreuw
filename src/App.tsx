import { useEffect, useRef, useState } from "react";
import { open } from '@tauri-apps/plugin-dialog';
//import { download } from '@tauri-apps/plugin-upload';
import { resolve } from "@tauri-apps/api/path";
import { exists, readTextFile } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { openUrl } from "@tauri-apps/plugin-opener";

export default function App() {
    const defaultState = "Ready!";
    const [currentState, setCurrentState] = useState(defaultState);
    const [appPath, setAppPath] = useState<string>("");
    const [oldMods, setOldMods] = useState<string[]>([]);
    const [ue4ssStatus, setUe4ssStatus] = useState(false);

    const tabButton1Ref = useRef<HTMLButtonElement>(null);
    const tabButton2Ref = useRef<HTMLButtonElement>(null);
    const tab1Ref = useRef<HTMLElement>(null);
    const tab2Ref = useRef<HTMLElement>(null);
    let modsListArray: any[] = [];

    useEffect(() => {
        async function listenForDeeplink() {
            await onOpenUrl(async (urls) => {
                setCurrentState("Getting mod information...")
                const parts = urls[0].replace(/^(homebreuw:(\/\/)?)/, "").split(",");

                if (parts[0] === "file") {
                    try {
                        modsListArray.push({ id: parts[2], name: parts[3], authors: "DEV MOD", downloadLink: `file://${parts[1]}`, enabled: true})
                        setCurrentState(defaultState);
                    } catch {
                        setCurrentState("Invalid dev mod format");
                    }
                } else {
                    try {
                        const resp = await fetch(`https://api.gamebanana.com/Core/Item/Data?itemtype=${parts[1]}&itemid=${parts[2]}&fields=name,authors`);
                        const modData = await resp.json();

                        const keyAuthorsArray: any[] = [];
                        
                        JSON.parse(modData[1])["Key Authors"].forEach((e: any) => {
                            keyAuthorsArray.push(e[0]);
                        });

                        modsListArray.push({ id: parts[2], name: modData[0], authors: keyAuthorsArray.join(", "), downloadLink: parts[0], enabled: true})
                        
                        setCurrentState(defaultState);
                    } catch {
                        setCurrentState("Error getting mod information.")
                    }
                }
            });
        }

        listenForDeeplink()

        /*async function getModsList(paigeIndex = 1) {
            try {
                setCurrentState("Getting list of mods...")
                const gamebananaPaige = 23645;
                const response = await fetch(`https://gamebanana.com/apiv11/Mod/Index?_nPerpage=50&_aFilters[Generic_Game]=${gamebananaPaige}&_nPage=${paigeIndex}`);
                const modsJson = await response.json();
                if (modsJson["_aMetadata"]["_nRecordCount"] >= modsJson["_aMetadata"]["_nPerpage"]) {
                    const paigeAmount = Math.ceil(modsJson["_aMetadata"]["_nRecordCount"] / modsJson["_aMetadata"]["_nPerpage"]);
                    if (paigeIndex < paigeAmount) {
                        modsJson["_aRecords"].forEach((e: any) => {
                            modsListArray.push(e);
                        });
                        console.log(modsListArray)
                        getModsList(paigeIndex + 1);
                        return;
                    }
                }

                if (paigeIndex <= 1) {
                    setModsList(modsJson["_aRecords"]);
                    setCurrentState(defaultState);
                } else {
                    setModsList(modsListArray);
                    setCurrentState(defaultState);
                }
            } catch (err) {
                setCurrentState(err as string)
            }
        };

        getModsList();*/
    }, [])

    async function handleBrowse() {
        setCurrentState('Selecting game folder')

        const file = await open({
            title: "Select game folder",
            defaultPath: "C:\Program Files (x86)\Steam\steamapps\common\Home Paige Demo",
            multiple: false,
            directory: true,
        });
        
        setAppPath(file ? file : "")
        if (file) {
            getOldMods(file)
        } else setCurrentState(defaultState);
    }

    async function getOldMods(file: string) {
        if (file === "") {
            setCurrentState(defaultState);
            setOldMods([]);
            return;
        }

        try {
            const binDir = await resolve(file, 'internetPlatformer', 'Binaries', 'Win64');
            const gameExists = await exists(await resolve(binDir, 'internetPlatformer-Win64-Shipping.exe'));
            if (!gameExists) {
                setCurrentState("Error! No game found in selected directory. Did you select the right path?");
                setOldMods([]);
                return;
            }
            try {
                const contents = await readTextFile(await resolve(binDir, 'HomeBreuw', "mods.json"));
                const ue4ssFolder = await exists(await resolve(binDir, 'ue4ss'))
                
                setUe4ssStatus(ue4ssFolder);
                setCurrentState(binDir);
                const oldModsList: string[] = [];
                JSON.parse(contents).forEach((e: any) => {
                    setCurrentState(e["mod_name"])
                    oldModsList.push(e["mod_name"])
                });
                setOldMods(oldModsList);
                setCurrentState(defaultState);
            } catch {
                setCurrentState(defaultState);
                setUe4ssStatus(false);
                setOldMods([]);
            }
            return;
        } catch (err) {
            setCurrentState(`Error! Error message: ${err as string}`)
            setUe4ssStatus(false);
            setOldMods([]);
            return;
        }
    }

    async function handleInstall() {
        
    }

    useEffect(() => {
        async function getSteamDir() {
            // find steam dir
            const steamDir = await resolve("C:/Program Files (x86)", "Steam/steamapps/common", "Home Paige Demo")
            const binDir = await resolve(steamDir, 'internetPlatformer', 'Binaries', 'Win64');
            const gameExists = await exists(await resolve(binDir, 'internetPlatformer-Win64-Shipping.exe'));
            if (!gameExists) {
                setCurrentState("Unable to find the Home Paige Demo, please select it manually.")
                return;
            }

            setAppPath(steamDir ? steamDir : "")
            if (steamDir) {
                getOldMods(steamDir)
            } else setCurrentState(defaultState);
        }
        getSteamDir();
    }, [])

    return (
        <>
            <div className="window-body m-0 h-full flex">
                <div className="grow p-4 pt-2 flex flex-col relative">
                    <section className="tabs h-full [&>article]:grow flex flex-col">
                        <menu role="tablist" aria-label="Sample Tabs">
                            <button role="tab" aria-selected="true" aria-controls="tab-A" ref={tabButton1Ref} onClick={(e) => {
                                e.currentTarget.ariaSelected = "true"; 
                                tabButton2Ref.current!.ariaSelected = "false"; 
                                tab1Ref.current!.hidden = false;
                                tab2Ref.current!.hidden = true;
                            }}>Home (Paige)</button>
                            <button role="tab" aria-controls="tab-B" ref={tabButton2Ref} onClick={(e) => {
                                e.currentTarget.ariaSelected = "true"; 
                                tabButton1Ref.current!.ariaSelected = "false"; 
                                tab1Ref.current!.hidden = true;
                                tab2Ref.current!.hidden = false;
                            }}>Mod listings</button>
                        </menu>
                        <article role="tabpanel" id="tab-A" ref={tab1Ref}>
                            <h3 className="font-comic-sans">Welcome to the Home Breuw app!</h3>
                            <p className="mt-2 font-sans">
                                Here you can install and find many mods for the Home Paige demo!
                                <br/><br/> 
                                To upload mods go to the GameBanana page for the game!
                            </p>
                            <div className="flex flex-col gap-2 py-4 mt-4 topbord overflow-y-auto">
                                <h5>Mods selected:</h5>
                                <p className="ml-4">Core mods:</p>
                                    <table className="ml-8">
                                        <thead>
                                            <tr>
                                                <th className="text-left">Name</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="h-1"></tr>
                                            <tr className="text-center">
                                                <td className="text-left">
                                                    <input checked disabled type="checkbox" id="ue4ss" />
                                                    <label htmlFor="ue4ss">UE4SS</label>
                                                </td>
                                                <td>{ue4ssStatus ? "Installed" : "Not installed"}</td>
                                            </tr>
                                            {/*<tr className="text-center">
                                                <td className="text-left">
                                                    <input checked disabled type="checkbox" id="modmenu" />
                                                    <label htmlFor="modmenu">Home Breuw</label>
                                                </td>
                                                <td>s</td>
                                            </tr>*/}
                                        </tbody>
                                    </table>
                                <p className="ml-4">Selectable mods:</p>
                                {(modsListArray && modsListArray.length > 0) ? (<table className="ml-8">
                                    <thead>
                                        <tr>
                                            <th className="text-left">Name</th>
                                            <th>Author</th>
                                            <th>Listing</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="h-1"></tr>
                                        {modsListArray.map((data, index) => (
                                            <tr key={index} className="text-center">
                                                <td className="text-left">
                                                    <input type="checkbox" id={index.toString()} defaultChecked={data.enabled} onClick={(e) => {
                                                        modsListArray[index].enabled = e.currentTarget.checked;
                                                    }} />
                                                    <label htmlFor={index.toString()}>{data.name}</label>
                                                </td>
                                                <td><label htmlFor={index.toString()}>{data.authors}</label></td>
                                                <td><a href="#" onClick={() => openUrl(`https://gamebanana.com/mods/${data.id}`)}>About</a></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>) : (<h5 className="ml-4">Go to the mod listings tab, or to GameBanana on your browser, to select mods to install!</h5>)}
                            </div>
                            
                        </article>
                        <article role="tabpanel" hidden id="tab-B" ref={tab2Ref}>
                            <p>Work in progress! Please visit GameBanana on your browser</p>
                        </article>
                    </section>
                    <div className="flex items-center justify-end gap-4">
                        <div className="flex items-center mr-auto justify-start gap-4">
                            <input
                                placeholder='The folder of internetPlatformer.exe'
                                className="min-w-84"
                                type="text"
                                value={appPath}
                                onChange={(e) => {setAppPath(e.currentTarget.value); getOldMods(e.currentTarget.value)}}
                            />
                            <button className="w-min" onClick={handleBrowse}>Browse</button>
                        </div>
                        <p>{oldMods.length > 0 ? `${oldMods.length} already installed mods found` : appPath == "" ? "No path selected!" : "No mods found from selected directory!"}</p>
                        <button onClick={handleInstall} disabled={appPath == "" ? true : false}>Install selected mods!</button>
                    </div>
                </div>
            </div>
            <div className="status-bar">
                <p className="status-bar-field">{currentState.toString()}</p>
            </div>
        </>
    );
}