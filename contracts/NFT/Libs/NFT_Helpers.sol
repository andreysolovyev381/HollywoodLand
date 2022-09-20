//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./NFTStructs.sol";
import "../../Libs/JsonWriter.sol";
import "../../Libs/IterableSet.sol";
import "../../Libs/ExternalFuncs.sol";

library NFT_Helpers {

    using JsonWriter for JsonWriter.Json;

    function getCollection (
        mapping (uint256 => NFTStructs.NFT) storage m_nfts,
        mapping (uint256 => IterableSet.Set) storage m_collections,
        mapping (uint256 => uint256) storage m_nft_to_projects,
        uint256 collection_id
    ) public view returns (string memory){

        JsonWriter.Json memory writer;
        writer = writer.writeStartObject();

        writer = writer.writeStringProperty("type", getStrFromNftType(m_nfts[collection_id]._type));
        writer = writer.writeUintProperty("project_id",  m_nft_to_projects[collection_id]);
        writer = writer.writeUintProperty("nft_id", collection_id);
        writer = writer.writeStringProperty("uri", m_nfts[collection_id]._uri);

        writer = writer.writeStartArray("NFTs");

        uint256 i = 0;
        uint256 s = IterableSet.size(m_collections[collection_id]);
        for (;i != s; ++i) {
            uint256 nft_id = IterableSet.getKeyAtIndex(m_collections[collection_id], i);
            writer = writer.writeStartObject();
            writer = writer.writeStringProperty("type", getStrFromNftType(m_nfts[nft_id]._type));
            writer = writer.writeUintProperty("project_id", m_nft_to_projects[nft_id]);
            writer = writer.writeUintProperty("collection_id", collection_id);
            writer = writer.writeUintProperty("nft_id", nft_id);
            writer = writer.writeStringProperty("uri", m_nfts[nft_id]._uri);
            writer = writer.writeEndObject();
        }
        writer = writer.writeEndArray();
        writer = writer.writeEndObject();
        return writer.value;
    }
    function getProject (
        mapping (uint256 => NFTStructs.NFT) storage m_nfts,
        mapping (uint256 => IterableSet.Set) storage m_projects,
        mapping (uint256 => uint256) storage m_nft_to_collection,
        uint256 project_id
    ) public view returns (string memory) {

        JsonWriter.Json memory writer;
        writer = writer.writeStartObject();
        writer = writer.writeStringProperty("type", getStrFromNftType(m_nfts[project_id]._type));
        writer = writer.writeUintProperty("nft_id", project_id);
        writer = writer.writeStringProperty("uri", m_nfts[project_id]._uri);

        writer = writer.writeStartArray("NFTs");

        uint256 i = 0;
        uint256 s = IterableSet.size(m_projects[project_id]);
        for (;i != s; ++i) {
            uint256 nft_id = IterableSet.getKeyAtIndex(m_projects[project_id], i);
            writer = writer.writeStartObject();
            writer = writer.writeStringProperty("type", getStrFromNftType(m_nfts[nft_id]._type));
            writer = writer.writeUintProperty("project_id", project_id);
            writer = writer.writeUintProperty("collection_id", m_nft_to_collection[nft_id]);
            writer = writer.writeUintProperty("nft_id", nft_id);
            writer = writer.writeStringProperty("uri", m_nfts[nft_id]._uri);
            writer = writer.writeEndObject();
        }

        writer = writer.writeEndArray();
        writer = writer.writeEndObject();

        return writer.value;
    }
    function getNFT (
        mapping (uint256 => NFTStructs.NFT) storage m_nfts,
        mapping (uint256 => uint256) storage m_nft_to_collection,
        mapping (uint256 => uint256) storage m_nft_to_projects,
        uint256 nft_id
    ) public view returns (string memory) {

        JsonWriter.Json memory writer;
        writer = writer.writeStartObject();
        writer = writer.writeStringProperty("type", getStrFromNftType(m_nfts[nft_id]._type));
        writer = writer.writeUintProperty("project_id",  m_nft_to_projects[nft_id]);
        writer = writer.writeUintProperty("collection_id", m_nft_to_collection[nft_id]);
        writer = writer.writeUintProperty("nft_id", nft_id);
        writer = writer.writeStringProperty("uri", m_nfts[nft_id]._uri);
        writer = writer.writeEndObject();

        return writer.value;
    }

    function getNftTypes (uint length) public pure returns (string[] memory) {
        string[] memory types = new string[](length);
        types[0] = "Project";
        types[1] = "Stake";
        types[2] = "Debt";
        types[3] = "Collection";
        types[4] = "ProjectArt";
        types[5] = "Ticket";
        types[6] = "Other";
        return types;
    }

    function checkNftType (string memory nft_type) private pure returns (bool) {
        return
        ExternalFuncs.equal(nft_type, "project")
        || ExternalFuncs.equal(nft_type, "stake")
        || ExternalFuncs.equal(nft_type, "debt")
        || ExternalFuncs.equal(nft_type, "projectart")
        || ExternalFuncs.equal(nft_type, "collection")
        || ExternalFuncs.equal(nft_type, "ticket")
        || ExternalFuncs.equal(nft_type, "other");
    }
    function getNftTypefromStr(string memory nft_type) public pure returns (NFTStructs.NftType) {
        string memory l = ExternalFuncs.toLower(nft_type);
        require (checkNftType(l), "Invalid nft_type, check getNftTypes() entrypoint");
        if (ExternalFuncs.equal(l, "project")) return NFTStructs.NftType.Project;
        else if (ExternalFuncs.equal(l, "stake")) return NFTStructs.NftType.Stake;
        else if (ExternalFuncs.equal(l, "debt")) return NFTStructs.NftType.Debt;
        else if (ExternalFuncs.equal(l, "collection")) return NFTStructs.NftType.Collection;
        else if (ExternalFuncs.equal(l, "projectart")) return NFTStructs.NftType.ProjectArt;
        else if (ExternalFuncs.equal(l, "ticket")) return NFTStructs.NftType.Ticket;
        else if (ExternalFuncs.equal(l, "other")) return NFTStructs.NftType.Other;
        else revert ("Unknown error in getNftTypefromStr()");
    }
    function getStrFromNftType(NFTStructs.NftType nft_type) public pure returns (string memory) {
        if (nft_type == NFTStructs.NftType.Project) return "Project";
        else if (nft_type == NFTStructs.NftType.Stake) return "Stake";
        else if (nft_type == NFTStructs.NftType.Debt) return "Debt";
        else if (nft_type == NFTStructs.NftType.Collection) return "Collection";
        else if (nft_type == NFTStructs.NftType.ProjectArt) return "ProjectArt";
        else if (nft_type == NFTStructs.NftType.Ticket) return "Ticket";
        else if (nft_type == NFTStructs.NftType.Other) return "Other";
        else revert ("Unknown error in getStrFromNftType()");
    }
}
