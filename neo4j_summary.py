import collections
from neo4j import GraphDatabase, exceptions

# --- ⚙️ Configuration ---
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
# IMPORTANT: Replace with your actual password before running
NEO4J_PASSWORD = "harshit123" 

# --- ⚙️ Customization ---
# How many example nodes to show for each label.
SAMPLE_NODES_PER_LABEL = 100
# Max connections to show for each example node.
CONNECTIONS_PER_SAMPLE_NODE = 25


class Neo4jRobustSummary:
    """
    A class to connect to a Neo4j database and generate a detailed summary
    of its schema, node samples, and relationship properties.
    """
    def __init__(self, uri, user, password):
        """
        Initializes the database driver.
        """
        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            self.driver.verify_connectivity()
            print("✅ Successfully connected to Neo4j.")
        except exceptions.AuthError:
            print(f"❌ Authentication failed. Please check your username and password.")
            self.driver = None
        except Exception as e:
            print(f"❌ Failed to connect to Neo4j. Error: {e}")
            self.driver = None

    def close(self):
        """
        Closes the database connection.
        """
        if self.driver:
            self.driver.close()
            print("\n✅ Connection to Neo4j closed.")

    def _get_node_representation(self, node):
        """
        Creates a human-readable string representation of a node's properties and labels.
        """
        # Creates a string like: {key1: 'value1', key2: 123}
        props = ", ".join([f"{key}: {repr(value)}" for key, value in node.items()])
        # Creates a string like: :Label1:Label2
        labels = ":".join(node.labels)
        return f"(:{labels} {{ {props} }})"

    def run_full_summary(self):
        """
        Executes a series of queries to build and print a comprehensive
        summary of the graph database.
        """
        if not self.driver:
            print("Cannot run summary due to connection failure.")
            return

        with self.driver.session(database="neo4j") as session:
            print("\n" + "="*80)
            print("📊 NEO4J GRAPH DEEP SUMMARY 📊".center(80))
            print("="*80)

            # --- Node Analysis ---
            print("\n##  nodos (Nodes) Summary\n")
            try:
                node_labels = session.run("CALL db.labels() YIELD label").value('label', default=[])
                if not node_labels:
                    print("No node labels found in the database.")

            except Exception as e:
                print(f"❗️Could not fetch node labels. Error: {e}")
                node_labels = []


            for label in node_labels:
                print(f"\n--- Analyzing Node Label: `{label}` ---\n")
                try:
                    count_result = session.run(f"MATCH (n:`{label}`) RETURN count(n) AS c").single()
                    count = count_result['c'] if count_result else 0
                    print(f"### Node Label: `{label}` ({count} nodes)")

                    # 1. Aggregate Relationship Patterns (Schema View)
                    print(f"\n    - Aggregate Relationship Patterns:")
                    patterns_query = f"""
                    MATCH (source:`{label}`)-[r]->(target)
                    RETURN type(r) AS relType, labels(target) AS targetLabels, count(r) AS freq
                    ORDER BY freq DESC
                    """
                    patterns = list(session.run(patterns_query))
                    if not patterns:
                        print("      - No outgoing relationships found.")
                    else:
                        for p in patterns:
                            target_labels_str = ':'.join(p['targetLabels']) if p['targetLabels'] else 'Node'
                            print(f"      - —[:{p['relType']}]→ (:{target_labels_str}): {p['freq']} relationships")

                    # 2. Connection Details for Sample Nodes (Instance View)
                    print(f"\n    - Connection Details for Sample Nodes (showing up to {SAMPLE_NODES_PER_LABEL} nodes):")
                    
                    # Base query to get nodes and their relationship counts (degree)
                    sample_nodes_query_template = """
                    MATCH (n:`{label}`)
                    OPTIONAL MATCH (n)-[r]-()
                    WITH n, count(r) AS degree
                    {order_by_clause}
                    RETURN n, degree
                    LIMIT $limit
                    """
                    
                    order_by_clause = ""
                    if label == 'TrendingTheme':
                        print("      - (Sorting by number of relationships for TrendingTheme, highest first)")
                        order_by_clause = "ORDER BY degree DESC"
                    
                    final_query = sample_nodes_query_template.format(label=label, order_by_clause=order_by_clause)
                    sample_nodes = list(session.run(final_query, limit=SAMPLE_NODES_PER_LABEL))
                    
                    if not sample_nodes:
                        print("      - No nodes available to sample.")
                    else:
                        for i, record in enumerate(sample_nodes):
                            node = record['n']
                            degree = record['degree']
                            print(f"\n        #{i+1}: {self._get_node_representation(node)} (Connections: {degree})")
                            
                            connections_query = """
                            MATCH (source)-[r]->(target) WHERE elementId(source) = $node_id
                            RETURN type(r) AS relType, target
                            LIMIT $conn_limit
                            """
                            connections = list(session.run(connections_query, 
                                                           node_id=node.element_id, 
                                                           conn_limit=CONNECTIONS_PER_SAMPLE_NODE))
                            
                            if not connections:
                                print("         - No outgoing connections.")
                            else:
                                for conn in connections:
                                    print(f"         - —[:{conn['relType']}]→ {self._get_node_representation(conn['target'])}")

                except Exception as e:
                    print(f"❗️ An error occurred while analyzing label `{label}`. Skipping. Error: {e}")

            # --- Relationship Property Analysis (with Frequency) ---
            print("\n" + "="*80)
            print("\n## 🔗 Relationship Property & Frequency Summary\n")
            try:
                rel_types = session.run("CALL db.relationshipTypes() YIELD relationshipType").value('relationshipType', default=[])
                if not rel_types:
                    print("No relationship types found in the database.")
            except Exception as e:
                print(f"❗️Could not fetch relationship types. Error: {e}")
                rel_types = []

            for rel_type in rel_types:
                try:
                    print(f"\n### Relationship Type: `{rel_type}`")
                    props_query = f"""
                    MATCH ()-[r:`{rel_type}`]->()
                    UNWIND keys(r) AS key
                    RETURN key, count(*) AS frequency
                    ORDER BY frequency DESC
                    """
                    properties = list(session.run(props_query))
                    if properties:
                        print(f"    - Property Frequencies:")
                        for prop in properties:
                            print(f"        - `{prop['key']}`: found on {prop['frequency']} relationships")
                    else:
                        print("    - This relationship type has no properties on any of its instances.")
                except Exception as e:
                    print(f"❗️ An error occurred while analyzing relationship `{rel_type}`. Skipping. Error: {e}")


if __name__ == "__main__":
    # Ensure you have updated the NEO4J_PASSWORD before running.
    summarizer = Neo4jRobustSummary(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    if summarizer.driver:
        summarizer.run_full_summary()
        summarizer.close()
